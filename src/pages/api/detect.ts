import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const form = formidable();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("ファイル解析エラー:", err);
        return res.status(500).json({ error: "ファイルの解析に失敗しました。" });
      }

      const file = files.filePath;
      if (!file) {
        return res.status(400).json({ error: "ファイルがアップロードされていません。" });
      }

      const singleFile = Array.isArray(file) ? file[0] : file;
      const originalFilename = (singleFile as File).originalFilename || "";
      const fileExtension = originalFilename.split(".").pop()?.toLowerCase();

      const allowedExtensions = ["jpg", "jpeg", "png"];
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        console.error(`許可されていない拡張子: ${fileExtension}`);
        return res.status(400).json({
          error: `許可されていないファイル形式です: ${fileExtension}`,
        });
      }

      const filePath = (singleFile as File).filepath;
      const fileData = fs.readFileSync(filePath);

      try {
        const response = await fetch("http://compreface/api/v1/detection/detect", {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            "x-api-key": process.env.AA_API_KEY || "",
          },
          body: fileData,
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("レスポンス:", result);

        // 顔データに座標情報を追加
        const faces = result.faces.map((face: any) => ({
          x: face.x,
          y: face.y,
          width: face.width,
          height: face.height,
        }));

        return res.status(200).json({ faces });
      } catch (error) {
        console.error("画像の送信に失敗しました:", error);
        return res.status(500).json({ error: "画像の送信に失敗しました。" });
      }
    });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
