import { useCallback, useState, useRef, useEffect} from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export default function UploadPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedImage(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
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
        className={`lg:w-[55%] h-60 flex items-center justify-center border-2 border-dashed rounded-lg transition ${
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
            Drag and drop an image here<br></br> or click to select one.
          </p>
        )}
      </div>
      
      <div className="flex gap-60">
        <button
          className="py-5 px-9 rounded bg-blue-500 text-white hover:bg-blue-600 text-xl"
          disabled={!selectedImage}
          onClick={() => setSelectedImage(null)}
        >
          delete image
        </button>
        
        <button
          className="py-5 px-9 rounded bg-blue-500 text-white hover:bg-blue-600 text-xl"
          onClick={handleButtonClick}
        >
          {selectedImage ? "mask" : "select image"}
        </button>
      </div>
      
    </div>
  );
}
