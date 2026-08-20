package gd.safety.Quiz.session;

import org.springframework.stereotype.Component;

import gd.safety.Quiz.config.GameSessionProperties;

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
