package org.dev.quizzle.account;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import org.yaml.snakeyaml.representer.Representer;

import org.dev.quizzle.config.AccountProperties;
import org.dev.quizzle.config.GameSessionProperties;

/**
 * Flat-file account storage. Accounts live in a single YAML file
 * (`data/accounts.yml` by default); every mutation reloads, edits, and rewrites
 * the whole file while holding a process-local lock. This is deliberately not a
 * database: account counts for a single-installation tool stay small.
 */
@Component
public final class AccountStore {

	private final Path file;
	private final boolean defaultAllowLateJoin;
	private final long defaultAutoAdvanceDelayMs;
	private final ReentrantLock lock = new ReentrantLock();

	public AccountStore(AccountProperties properties, GameSessionProperties sessionProperties) {
		this.file = properties.file();
		this.defaultAllowLateJoin = sessionProperties.allowJoinAfterStart();
		this.defaultAutoAdvanceDelayMs = sessionProperties.autoAdvanceDelayMs();
	}

	public Optional<Account> findByEmail(String email) {
		String normalized = normalizeEmail(email);
		lock.lock();
		try {
			return readAll().stream().filter(account -> account.email().equals(normalized)).findFirst();
		} finally {
			lock.unlock();
		}
	}

	public Optional<Account> findById(String id) {
		lock.lock();
		try {
			return readAll().stream().filter(account -> account.id().equals(id)).findFirst();
		} finally {
			lock.unlock();
		}
	}

	public Account create(Account account) {
		lock.lock();
		try {
			List<Account> accounts = readAll();
			accounts.add(account);
			writeAll(accounts);
			return account;
		} finally {
			lock.unlock();
		}
	}

	public void update(Account account) {
		lock.lock();
		try {
			List<Account> accounts = readAll();
			boolean replaced = false;
			for (int index = 0; index < accounts.size(); index++) {
				if (accounts.get(index).id().equals(account.id())) {
					accounts.set(index, account);
					replaced = true;
					break;
				}
			}
			if (!replaced) {
				throw new IllegalArgumentException("No account with id " + account.id());
			}
			writeAll(accounts);
		} finally {
			lock.unlock();
		}
	}

	public void delete(String id) {
		lock.lock();
		try {
			List<Account> accounts = readAll();
			accounts.removeIf(account -> account.id().equals(id));
			writeAll(accounts);
		} finally {
			lock.unlock();
		}
	}

	public static String normalizeEmail(String email) {
		return email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
	}

	private List<Account> readAll() {
		if (!Files.isRegularFile(file)) {
			return new ArrayList<>();
		}

		Object document;
		try (InputStream input = Files.newInputStream(file)) {
			document = createLoaderYaml().load(input);
		} catch (IOException exception) {
			throw new AccountFileException("Could not read accounts file", exception);
		}
		if (!(document instanceof Map<?, ?> root)) {
			return new ArrayList<>();
		}

		Object rawAccounts = root.get("accounts");
		if (!(rawAccounts instanceof List<?> list)) {
			return new ArrayList<>();
		}

		List<Account> accounts = new ArrayList<>(list.size());
		for (Object entry : list) {
			if (entry instanceof Map<?, ?> map) {
				accounts.add(toAccount(map));
			}
		}
		return accounts;
	}

	@SuppressWarnings("unchecked")
	private Account toAccount(Map<?, ?> map) {
		Map<String, Object> values = (Map<String, Object>) map;
		List<String> roles = values.get("roles") instanceof List<?> rawRoles
				? rawRoles.stream().map(String::valueOf).toList()
				: List.of();
		return new Account(
				String.valueOf(values.get("id")),
				String.valueOf(values.get("email")),
				String.valueOf(values.get("passwordHash")),
				Boolean.TRUE.equals(values.get("verified")),
				roles,
				values.get("createdAtEpochMs") instanceof Number number ? number.longValue() : 0L,
				values.get("allowLateJoin") instanceof Boolean flag ? flag : defaultAllowLateJoin,
				values.get("autoAdvanceDelayMs") instanceof Number delay
						? delay.longValue()
						: defaultAutoAdvanceDelayMs);
	}

	private void writeAll(List<Account> accounts) {
		Map<String, Object> root = new LinkedHashMap<>();
		List<Map<String, Object>> serialized = new ArrayList<>(accounts.size());
		for (Account account : accounts) {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("id", account.id());
			map.put("email", account.email());
			map.put("passwordHash", account.passwordHash());
			map.put("verified", account.verified());
			map.put("roles", new ArrayList<>(account.roles()));
			map.put("createdAtEpochMs", account.createdAtEpochMs());
			map.put("allowLateJoin", account.allowLateJoin());
			map.put("autoAdvanceDelayMs", account.autoAdvanceDelayMs());
			serialized.add(map);
		}
		root.put("accounts", serialized);

		try {
			Path parent = file.toAbsolutePath().normalize().getParent();
			if (parent != null) {
				Files.createDirectories(parent);
			}
			Path tempFile = file.resolveSibling(file.getFileName() + ".tmp");
			try (OutputStream output = Files.newOutputStream(tempFile)) {
				createDumperYaml().dump(root, new java.io.OutputStreamWriter(output, java.nio.charset.StandardCharsets.UTF_8));
			}
			Files.move(tempFile, file, java.nio.file.StandardCopyOption.REPLACE_EXISTING,
					java.nio.file.StandardCopyOption.ATOMIC_MOVE);
		} catch (IOException exception) {
			throw new AccountFileException("Could not write accounts file", exception);
		}
	}

	private Yaml createLoaderYaml() {
		LoaderOptions options = new LoaderOptions();
		options.setAllowDuplicateKeys(false);
		options.setMaxAliasesForCollections(0);
		return new Yaml(new SafeConstructor(options));
	}

	private Yaml createDumperYaml() {
		DumperOptions options = new DumperOptions();
		options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
		options.setPrettyFlow(true);
		return new Yaml(new Representer(options), options);
	}
}
