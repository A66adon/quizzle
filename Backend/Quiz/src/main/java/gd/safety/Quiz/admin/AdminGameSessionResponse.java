package gd.safety.Quiz.admin;

import gd.safety.Quiz.session.GameSessionSnapshot;
import gd.safety.Quiz.session.SessionAddressService;

public record AdminGameSessionResponse(
		String codehash,
		String quizFileName,
		String quizTitle,
		String state,
		int currentQuestionIndex,
		int questionCount,
		long serverStartEpochMs,
		long durationMs,
		boolean podiumOpen,
		long createdAtEpochMs,
		long updatedAtEpochMs,
		String joinUrl,
		String qrUrl) {

	public static AdminGameSessionResponse from(
			GameSessionSnapshot snapshot,
			SessionAddressService addressService) {
		long durationMs = snapshot.currentQuestionIndex() < 0
				? 0
				: snapshot.quiz().questions().get(snapshot.currentQuestionIndex()).timeSeconds() * 1_000L;
		return new AdminGameSessionResponse(
				snapshot.codehash(),
				snapshot.quizFileName(),
				snapshot.quiz().title(),
				snapshot.state().name(),
				snapshot.currentQuestionIndex(),
				snapshot.quiz().questions().size(),
				snapshot.serverStartEpochMs(),
				durationMs,
				snapshot.podiumOpen(),
				snapshot.createdAtEpochMs(),
				snapshot.updatedAtEpochMs(),
				addressService.joinUrl(snapshot.codehash()),
				"/admin/api/sessions/" + snapshot.codehash() + "/qr.svg");
	}
}
