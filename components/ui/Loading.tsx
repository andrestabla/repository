import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background/80 backdrop-blur-sm z-50">
      <div className="relative w-24 h-24">
        <Image
          src="https://imageneseiconos.s3.us-east-1.amazonaws.com/iconos/loading.gif"
          alt="Loading..."
          fill
          className="object-contain"
          unoptimized // Required for external GIFs if domains aren't configured
          priority
        />
      </div>
    </div>
  );
}
