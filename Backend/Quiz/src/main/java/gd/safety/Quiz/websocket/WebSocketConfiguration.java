package gd.safety.Quiz.websocket;

import java.net.URI;

import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import gd.safety.Quiz.config.GameSessionProperties;
import gd.safety.Quiz.config.WebSocketProperties;

@Configuration
@EnableWebSocket
public class WebSocketConfiguration implements WebSocketConfigurer {

	private final GameSessionWebSocketHandler handler;
	private final CodehashHandshakeInterceptor handshakeInterceptor;
	private final String allowedOrigin;

	public WebSocketConfiguration(
			GameSessionWebSocketHandler handler,
			CodehashHandshakeInterceptor handshakeInterceptor,
			GameSessionProperties sessionProperties) {
		this.handler = handler;
		this.handshakeInterceptor = handshakeInterceptor;
		URI publicBaseUrl = sessionProperties.publicBaseUrl();
		allowedOrigin = publicBaseUrl.getScheme() + "://" + publicBaseUrl.getAuthority();
	}

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(handler, "/{codehash}/data")
				.addInterceptors(handshakeInterceptor)
				.setAllowedOrigins(allowedOrigin);
	}

	@Bean
	WebServerFactoryCustomizer<TomcatServletWebServerFactory> webSocketBufferLimits(
			WebSocketProperties properties) {
		return factory -> factory.addContextCustomizers(context -> {
			context.addParameter(
					"org.apache.tomcat.websocket.textBufferSize",
					String.valueOf(properties.maxMessageBytes()));
			context.addParameter("org.apache.tomcat.websocket.binaryBufferSize", "1024");
		});
	}
}
