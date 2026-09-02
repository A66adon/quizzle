package gd.safety.quizzle.session;

import org.springframework.stereotype.Component;

import gd.safety.quizzle.config.GameSessionProperties;

@Component
public final class SessionAddressService {

	private final String publicBaseUrl;

	public SessionAddressService(GameSessionProperties properties) {
		publicBaseUrl = properties.publicBaseUrl().toString().replaceAll("/+$", "");
	}

	public String joinUrl(String codehash) {
		return publicBaseUrl + "/" + codehash + "/";
	}
}
