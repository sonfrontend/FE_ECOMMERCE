import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, fallbackSrc, alt, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  );
};

export default SafeImage;
