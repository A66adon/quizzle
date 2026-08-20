package gd.safety.Quiz.config;

import java.net.URI;
import java.util.Objects;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.session")
public record GameSessionProperties(URI publicBaseUrl, int codehashLength) {

	public GameSessionProperties {
		Objects.requireNonNull(publicBaseUrl, "quiz.session.public-base-url must be configured");
		String scheme = publicBaseUrl.getScheme();
		if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))
				|| publicBaseUrl.getHost() == null || publicBaseUrl.getQuery() != null
				|| publicBaseUrl.getFragment() != null) {
			throw new IllegalArgumentException(
					"quiz.session.public-base-url must be an absolute HTTP(S) URL without query or fragment");
		}
		if (codehashLength < 8 || codehashLength > 32) {
			throw new IllegalArgumentException("quiz.session.codehash-length must be between 8 and 32");
		}
	}
}
