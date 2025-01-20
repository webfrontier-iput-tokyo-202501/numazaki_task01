import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

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

      console.log("Uploaded file:", file);
      console.log("File path:", filePath);

      if (!filePath) {
        res.status(400).json({ error: "File path is undefined" });
        return;
      }

      // CompreFace に送信
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath), file.originalFilename || "upload.jpg");

      const apiResponse = await fetch("http://compreface/api/v1/detection/detect", {
        method: "POST",
        headers: {
          "x-api-key": process.env.COMPREFACE_API_KEY || "",
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
      res.status(200).json({ message: "送信成功", response: responseData });
    } catch (error) {
      console.error("サーバーエラー:", error);
      res.status(500).json({ error: "サーバーエラーが発生しました" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}