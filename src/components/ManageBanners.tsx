const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImageFile: (f: File) => void, setImagePreview: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

export default handleImageChange;
