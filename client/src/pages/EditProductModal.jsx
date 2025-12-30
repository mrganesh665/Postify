import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";

const EditProductModal = ({ open, product, onClose, onSave }) => {
  const methods = useForm({
    defaultValues: {
      title: "",
      price: "",
      description: "",
      productimage: null,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = methods;

  const [previewUrl, setPreviewUrl] = useState(null);

  /* Prefill when product changes */
  useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        price: product.price,
        description: product.description,
        productimage: null,
      });
      setPreviewUrl(null);
    }
  }, [product, reset]);

  /* Image preview with cleanup */
  const productImage = watch("productimage");
  useEffect(() => {
    if (productImage?.[0] instanceof File) {
      const url = URL.createObjectURL(productImage[0]);
      setPreviewUrl(url);

      return () => URL.revokeObjectURL(url);
    }
  }, [productImage]);

  const onSubmit = async (data) => {
    const formPayload = new FormData();

    if (data.productimage?.[0] instanceof File) {
      formPayload.append("productimage", data.productimage[0]);
    }

    formPayload.append("title", data.title);
    formPayload.append("price", data.price);
    formPayload.append("description", data.description);

    await onSave(product._id, formPayload); // wait for API
    onClose(); // close only after success
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Product</DialogTitle>

      <DialogContent>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column" }}>
              <TextField
                label="Product Title"
                fullWidth
                sx={{ mb: 1 }}
                {...register("title", { required: "Title is required" })}
                error={!!errors.title}
                helperText={errors.title?.message}
              />

              <Button
                variant="contained"
                fullWidth
                sx={{ backgroundColor: "#59e3a7", mb: 1 }}
                onClick={() =>
                  document.getElementById("edit-product-image").click()
                }
              >
                Change Image
              </Button>

              <input
                id="edit-product-image"
                type="file"
                hidden
                {...register("productimage", {
                  validate: {
                    validFileType: (value) =>
                      !value ||
                      !value[0] ||
                      ["image/jpeg", "image/png"].includes(value[0].type) ||
                      "Only JPEG and PNG allowed",
                  },
                })}
              />

              {errors.productimage && (
                <Typography color="error" variant="body2">
                  {errors.productimage.message}
                </Typography>
              )}

              {/* Preview */}
              {previewUrl ? (
                <Box sx={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={previewUrl}
                    width="120"
                    height="70"
                    style={{ borderRadius: 6 }}
                  />
                  <IconButton
                    sx={{ position: "absolute", right: -10, bottom: 0 }}
                    onClick={() => {
                      setValue("productimage", null);
                      setPreviewUrl(null);
                    }}
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </Box>
              ) : (
                product?.image && (
                  <img
                    src={`${import.meta.env.VITE_SERVER_ENDPOINT}/productimage/${product.image}`}
                    width="120"
                    height="70"
                    style={{ borderRadius: 6 }}
                  />
                )
              )}

              <TextField
                label="Price"
                fullWidth
                sx={{ mt: 1 }}
                {...register("price", { required: "Price is required" })}
                error={!!errors.price}
                helperText={errors.price?.message}
              />

              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                sx={{ mt: 1 }}
                {...register("description", {
                  required: "Description is required",
                })}
                error={!!errors.description}
                helperText={errors.description?.message}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, backgroundColor: "#59e3a7" }}
              >
                Update Product
              </Button>
            </Box>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
