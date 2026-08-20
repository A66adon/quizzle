package gd.safety.Quiz.websocket;

import java.net.URI;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

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
	ServletServerContainerFactoryBean webSocketContainer(WebSocketProperties properties) {
		ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
		container.setMaxTextMessageBufferSize(properties.maxMessageBytes());
		container.setMaxBinaryMessageBufferSize(1_024);
		return container;
	}
}
