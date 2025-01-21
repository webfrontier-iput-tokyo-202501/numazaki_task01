import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import { createCanvas, loadImage } from "canvas";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // formidable を使用するために bodyParser を無効化
  },
};

// formidable を Promise でラップ
const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const form = formidable();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      // フォームデータを解析
      const { fields, files } = await parseForm(req);

      // ファイル情報を取得
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      const filePath = file.filepath;

      // 必要な情報だけをログ出力
      console.log("Uploaded file:", {
        originalFilename: file.originalFilename,
        filepath: filePath,
        size: file.size,
      });

      if (!filePath) {
        res.status(400).json({ error: "File path is undefined" });
        return;
      }

      // 画像を読み込む
      let image;
      try {
        image = await loadImage(filePath);
      } catch (error) {
        console.error("画像の読み込みエラー:", error);
        res.status(400).json({ error: "画像の読み込みに失敗しました。" });
        return;
      }

      // APIリクエストを送信して座標を取得
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath), file.originalFilename || "upload.jpg");

      const apiResponse = await fetch("http://compreface/api/v1/detection/detect", {
        method: "POST",
        headers: {
          "x-api-key": process.env.faceplace_API_KEY || "",
        },
        body: formData as any,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("APIエラー:", errorText);
        res.status(apiResponse.status).json({ error: `APIエラー: ${errorText}` });
        return;
      }

      const responseData = await apiResponse.json();
      const detectedFaces = responseData?.result || [];

      if (!detectedFaces.length) {
        return res.status(200).json({ message: "No faces detected", previewUrl: null });
      }

      // 顔の座標をログ出力
      console.log("Detected faces:", detectedFaces.map(face => face.box));

      // 画像とマスクを重ねる
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);

      // マスク画像を読み込む
      let maskImage;
      try {
        maskImage = await loadImage(path.join(process.cwd(), "public", "wanted.png"));
      } catch (error) {
        console.error("マスク画像の読み込みエラー:", error);
        res.status(400).json({ error: "マスク画像の読み込みに失敗しました。" });
        return;
      }

      detectedFaces.forEach(({ box: { x_min, y_min, x_max, y_max } }: any) => {
        const maskWidth = x_max - x_min;
        const maskHeight = y_max - y_min;
        ctx.drawImage(maskImage, x_min, y_min, maskWidth, maskHeight);
      });

      // 保存先パスとURL
      const outputDir = path.join(process.cwd(), "public", "output");
      const outputFilePath = path.join(outputDir, "masked_image.png");
      const outputUrl = `/output/masked_image.png`;

      // 出力ディレクトリが存在しない場合に作成
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 画像を保存
      const out = fs.createWriteStream(outputFilePath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      out.on("finish", () => {
        console.log("Masked image saved.");
      });

      // クライアントにプレビュー用URLを返す
      return res.status(200).json({ message: "Image processed successfully", previewUrl: outputUrl });
    } catch (error) {
      console.error("Processing error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}