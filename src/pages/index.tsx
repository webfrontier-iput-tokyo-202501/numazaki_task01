import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";

const App: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null); // プレビュー用URL
  const [file, setFile] = useState<File | null>(null); // アップロードするファイル
  const [responseMessage, setResponseMessage] = useState<string | null>(null); // レスポンス結果
  const [isMasked, setIsMasked] = useState<boolean>(false); // マスクが完了したかどうか
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージ
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Canvas参照

  // ドラッグ＆ドロップ時の処理
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      const imageUrl = URL.createObjectURL(uploadedFile);
      setPreview(imageUrl);
      setIsMasked(false); // マスクが完了していない状態にリセット
      setErrorMessage(null); // エラーメッセージをリセット
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "image/*": [] },
  });

  // プレビュー画像をCanvasに描画
  useEffect(() => {
    if (preview) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = preview;

      img.onload = () => {
        const canvasWidth = canvas.parentElement?.clientWidth || 800;
        const canvasHeight = canvas.parentElement?.clientHeight || 250;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // 画像のアスペクト比を計算
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspectRatio > canvasAspectRatio) {
          // 画像が横長
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgAspectRatio;
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        } else {
          // 画像が縦長
          drawWidth = canvasHeight * imgAspectRatio;
          drawHeight = canvasHeight;
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      };

      img.onerror = () => {
        console.error("画像の読み込みに失敗しました。");
        setErrorMessage("画像の読み込みに失敗しました。");
      };
    }
  }, [preview]);

  // 画像を送信して顔部分に画像を貼り付け
  const sendImage = async () => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.previewUrl) {
          // キャッシュをバイパスするために一意のクエリパラメータを追加
          const uniqueUrl = `${jsonResponse.previewUrl}?t=${new Date().getTime()}`;
          setPreview(uniqueUrl); // マスクされた画像のプレビューURLを設定
          setResponseMessage("顔検出が完了しました。");
          setIsMasked(true); // マスクが完了した状態に設定
        } else {
          setErrorMessage("顔が検出できませんでした。"); // エラーメッセージを設定
        }
      } else {
        const errorResponse = await response.json();
        if (errorResponse.code === 28) {
          setErrorMessage("顔が検出できませんでした。"); // エラーメッセージを設定
        } else {
          console.error("アップロードエラー:", errorResponse.error || response.statusText);
          setResponseMessage(errorResponse.error || "エラーが発生しました。");
        }
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      setResponseMessage("ネットワークエラーが発生しました。");
    }
  };

  // 画像を削除
  const onDelete = () => {
    setPreview(null);
    setFile(null);
    setResponseMessage(null);
    setIsMasked(false); // マスクが完了していない状態にリセット
    setErrorMessage(null); // エラーメッセージをリセット
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // 最初の画面に戻る
  const onReset = () => {
    onDelete();
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      {/* ドラッグ＆ドロップエリア */}
      <div
        {...getRootProps()}
        className="relative flex flex-col justify-center items-center text-lg w-[800px] h-[325px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-400"
      >
        <input {...getInputProps()} />
        {!preview && <p className="text-gray-500">画像をドラックアンドドロップ</p>}
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>

      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="mt-4 text-red-500">
          {errorMessage}
        </div>
      )}

      {/* ボタン */}
      <div className="mt-10 flex justify-center gap-20">
        {isMasked ? (
          // マスクが完了した後に表示される戻るボタン
          <button
            onClick={onReset}
            className="px-9 py-5 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
          >
            戻る
          </button>
        ) : (
          <>
            {/* 左側: 写真を削除 */}
            <button
              onClick={onDelete}
              disabled={!preview}
              className={`px-9 py-5 rounded ${
                preview
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } focus:outline-none`}
            >
              写真を削除
            </button>

            {/* 右側: 写真を選択/送信 */}
            {preview ? (
              <button
                onClick={sendImage}
                className="px-9 py-5 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
              >
                写真を送信
              </button>
            ) : (
              <button
                onClick={open}
                className="px-9 py-5 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
              >
                写真を選択
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;