const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // OPTIMIZATION: Use URL.createObjectURL instead of FileReader.readAsDataURL
      // This prevents converting to large base64 strings in memory on mobile devices
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };