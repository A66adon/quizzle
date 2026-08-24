package gd.safety.quizzle.session;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

@Component
public final class QrCodeService {

	private static final int QR_SIZE = 256;

	public String createSvg(String value) {
		try {
			BitMatrix matrix = new MultiFormatWriter().encode(
					value,
					BarcodeFormat.QR_CODE,
					QR_SIZE,
					QR_SIZE,
					Map.of(
							EncodeHintType.CHARACTER_SET, "UTF-8",
							EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
							EncodeHintType.MARGIN, 2));
			return renderSvg(matrix);
		} catch (WriterException exception) {
			throw new IllegalStateException("Could not generate the session QR code", exception);
		}
	}

	private String renderSvg(BitMatrix matrix) {
		StringBuilder path = new StringBuilder(matrix.getWidth() * matrix.getHeight());
		for (int y = 0; y < matrix.getHeight(); y++) {
			int x = 0;
			while (x < matrix.getWidth()) {
				while (x < matrix.getWidth() && !matrix.get(x, y)) {
					x++;
				}
				int runStart = x;
				while (x < matrix.getWidth() && matrix.get(x, y)) {
					x++;
				}
				if (runStart < x) {
					int runLength = x - runStart;
					path.append('M').append(runStart).append(' ').append(y)
							.append('h').append(runLength).append("v1h-").append(runLength).append('z');
				}
			}
		}

		return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 "
				+ matrix.getWidth() + " " + matrix.getHeight()
				+ "\" shape-rendering=\"crispEdges\" role=\"img\" aria-label=\"Join QR code\">"
				+ "<rect width=\"100%\" height=\"100%\" fill=\"#fff\"/>"
				+ "<path d=\"" + path + "\" fill=\"#040066\"/></svg>";
	}
}
