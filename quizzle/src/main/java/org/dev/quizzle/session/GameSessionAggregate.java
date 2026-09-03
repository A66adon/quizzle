package org.dev.quizzle.session;

import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Consumer;
import java.util.function.UnaryOperator;

final class GameSessionAggregate {

	private final ReentrantLock writerLock = new ReentrantLock(true);
	private volatile GameSessionSnapshot current;

	GameSessionAggregate(GameSessionSnapshot initialSnapshot) {
		current = initialSnapshot;
	}

	GameSessionSnapshot snapshot() {
		return current;
	}

	GameSessionSnapshot update(
			UnaryOperator<GameSessionSnapshot> mutation,
			Consumer<GameSessionSnapshot> snapshotWriter) {
		writerLock.lock();
		try {
			GameSessionSnapshot candidate = mutation.apply(current);
			if (candidate == current || candidate.equals(current)) {
				return current;
			}
			snapshotWriter.accept(candidate);
			current = candidate;
			return candidate;
		} finally {
			writerLock.unlock();
		}
	}

	GameSessionSnapshot updateInMemory(UnaryOperator<GameSessionSnapshot> mutation) {
		writerLock.lock();
		try {
			GameSessionSnapshot candidate = mutation.apply(current);
			if (candidate != current && !candidate.equals(current)) {
				current = candidate;
			}
			return current;
		} finally {
			writerLock.unlock();
		}
	}

	void persistCurrent(Consumer<GameSessionSnapshot> snapshotWriter) {
		writerLock.lock();
		try {
			snapshotWriter.accept(current);
		} finally {
			writerLock.unlock();
		}
	}
}




