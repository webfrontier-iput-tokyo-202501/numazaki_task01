import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const App: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null); // プレビュー用URL
  const [file, setFile] = useState<File | null>(null); // アップロードするファイル
  const [responseMessage, setResponseMessage] = useState<string | null>(null); // レスポンス結果
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージ

  // ドラッグ＆ドロップ時の処理
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setErrorMessage(null);
    setResponseMessage(null);

    if (fileRejections.length > 0) {
      setErrorMessage("画像ファイル以外はアップロードできません。");
    } else if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setPreview(URL.createObjectURL(uploadedFile)); // プレビュー用URLを作成
    }
  }, []);

  // 画像を送信
  const sendImage = async () => {
    if (!file) {
      setErrorMessage("送信する画像がありません。");
      return;
    }

    setErrorMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        setResponseMessage(`送信成功: ${JSON.stringify(jsonResponse)}`);
      } else {
        setErrorMessage(`アップロード失敗: ${response.statusText}`);
      }
    } catch (error) {
      setErrorMessage(`エラーが発生しました: ${(error as Error).message}`);
    }
  };

  // 画像を削除
  const onDelete = () => {
    setPreview(null);
    setFile(null);
    setResponseMessage(null);
    setErrorMessage(null);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "image/*": [] },
  });

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      <div
        {...getRootProps()}
        className={`relative flex flex-col justify-center items-center w-[800px] h-[250px] bg-gray-100 rounded-lg ${
          isDragActive ? "border-2 border-green-500" : "border-2 border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="absolute inset-0 flex justify-center items-center">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-full rounded-lg"
            />
          </div>
        ) : (
          <p className="text-gray-500">
            画像をドラッグ・アンド・ドロップ
          </p>
        )}
      </div>
      {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
      {responseMessage && (
        <pre className="text-green-500 mt-4 bg-gray-100 p-4 rounded">
          {responseMessage}
        </pre>
      )}
      <div className="mt-10 flex justify-center gap-60">
        {preview ? (
          <>
            <button
              onClick={onDelete}
              className="px-9 py-5 rounded bg-orange-500 text-white hover:bg-orange-600 focus:outline-none"
            >
              画像を削除
            </button>
            <button
              onClick={sendImage}
              className="px-9 py-5 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
            >
              画像を送信
            </button>
          </>
        ) : (
          <button
            onClick={open}
            className="px-9 py-5 rounded bg-green-500 text-white hover:bg-green-600 focus:outline-none"
          >
            画像を選択する
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
