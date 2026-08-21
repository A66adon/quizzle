const COLORS = ["#00d4ff", "#040066", "#ffc53d", "#ef476f", "#06d6a0", "#ffffff"];
const GRAVITY = 0.00042;
const DRAG = 0.9985;

// A single canvas is reused so repeated renders of the winner screen cannot stack overlays.
let activeRun = null;

export function launchConfetti({ durationMs = 7_000, pieceCount = 170 } = {}) {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	stopConfetti();

	const canvas = document.createElement("canvas");
	canvas.className = "confetti-canvas";
	canvas.setAttribute("aria-hidden", "true");
	document.body.append(canvas);
	const context = canvas.getContext("2d");
	if (!context) {
		canvas.remove();
		return;
	}

	const resize = () => {
		const ratio = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = Math.max(1, Math.floor(window.innerWidth * ratio));
		canvas.height = Math.max(1, Math.floor(window.innerHeight * ratio));
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
	};
	resize();
	window.addEventListener("resize", resize);

	const pieces = Array.from({ length: pieceCount }, () => createPiece());
	const startedAt = performance.now();
	let previousFrameAt = startedAt;
	let frame = 0;

	const run = { canvas, resize, stop: () => cancelAnimationFrame(frame) };
	activeRun = run;

	const draw = now => {
		if (activeRun !== run) return;
		const deltaMs = Math.min(48, now - previousFrameAt);
		previousFrameAt = now;
		const fadeOut = Math.max(0, Math.min(1, (durationMs - (now - startedAt)) / 1_200));
		context.clearRect(0, 0, window.innerWidth, window.innerHeight);
		context.globalAlpha = fadeOut;

		for (const piece of pieces) {
			piece.velocityY += GRAVITY * deltaMs;
			piece.velocityX *= DRAG;
			piece.x += piece.velocityX * deltaMs;
			piece.y += piece.velocityY * deltaMs;
			piece.spin += piece.spinSpeed * deltaMs;
			if (piece.y > window.innerHeight + 40) Object.assign(piece, createPiece(), { y: -40 });

			context.save();
			context.translate(piece.x, piece.y);
			context.rotate(piece.spin);
			context.fillStyle = piece.color;
			context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
			context.restore();
		}

		if (now - startedAt >= durationMs) {
			stopConfetti();
			return;
		}
		frame = requestAnimationFrame(draw);
	};

	frame = requestAnimationFrame(draw);
}

export function stopConfetti() {
	if (!activeRun) return;
	const finished = activeRun;
	activeRun = null;
	finished.stop();
	window.removeEventListener("resize", finished.resize);
	finished.canvas.remove();
}

function createPiece() {
	return {
		x: Math.random() * window.innerWidth,
		y: -20 - Math.random() * window.innerHeight * 0.5,
		velocityX: (Math.random() - 0.5) * 0.22,
		velocityY: 0.12 + Math.random() * 0.22,
		width: 6 + Math.random() * 7,
		height: 9 + Math.random() * 9,
		spin: Math.random() * Math.PI,
		spinSpeed: (Math.random() - 0.5) * 0.012,
		color: COLORS[Math.floor(Math.random() * COLORS.length)]
	};
}
