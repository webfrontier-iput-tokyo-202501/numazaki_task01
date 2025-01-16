import { useCallback, useState} from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export default function UploadPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setErrorMessage(null);
    if (acceptedFiles.length > 0) {
      setSelectedImage(acceptedFiles[0]);
    }

  }, []);

  const onDropRejected = useCallback(() => {
    setErrorMessage("選択できるのは画像ファイルのみです");
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/*": [],
    },
    noClick: true,
    multiple: false,
  });


  const handleButtonClick = () => {
    if (selectedImage) {
      alert("マスクをつける処理を実行しました！");
    } else {
      open();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8 bg-gray-100">
      <div
        {...getRootProps()}
        className={`lg:w-[80%] h-80 flex items-center justify-center border-2 border-dashed rounded-lg transition ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-400 bg-white"
        }`}
      >
        <input {...getInputProps()} />
        {selectedImage ? (
          <Image
            src={URL.createObjectURL(selectedImage)}
            alt="Uploaded image"
            width={1000}
            height={1000}
            className="object-contain max-w-[600px] max-h-[300px]"
          />
        ) : (
          <p className="text-gray-600 text-center text-2xl">
            画像をドラッグアンドドロップ
          </p>
        )}
      </div>
      
      {errorMessage && (
        <p className="text-red-500 text-lg">{errorMessage}</p> 
      )}

      <div className="flex gap-60">
        <button
          className="py-5 px-9 rounded bg-blue-500 text-white hover:bg-blue-600 text-xl"
          disabled={!selectedImage}
          onClick={() => setSelectedImage(null)}
        >
          画像を削除
        </button>
        
        <button
          className="py-5 px-9 rounded bg-blue-500 text-white hover:bg-blue-600 text-xl"
          onClick={handleButtonClick}
        >
          {selectedImage ? "マスクする" : "画像を選択"}
        </button>
      </div>
      
    </div>
  );
}
