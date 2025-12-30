import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import useThinkify from "../hooks/useThinkify";
import axios from "axios";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import { Delete, Edit } from "@mui/icons-material";
import EditProductModal from "./EditProductModal";

const MyProduct = () => {
  const [data, setData] = useState([]);
  const {
    setLoadingStatus,
    setAlertBoxOpenStatus,
    setAlertMessage,
    setAlertSeverity,
  } = useThinkify();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStatus(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_ENDPOINT}/products`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get(
                import.meta.env.VITE_TOKEN_KEY
              )}`,
            },
          }
        );
        if (response.data.status) {
          setData(response.data.products);
        } else {
          setAlertBoxOpenStatus(true);
          setAlertSeverity("error");
          setAlertMessage(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setAlertBoxOpenStatus(true);
        setAlertSeverity("error");
        setAlertMessage(
          error.response?.data?.message || "Something Went Wrong"
        );
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchData();
  }, []);

  if (data.length === 0) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography variant="h4" color="#1b2e35">
          No Product Available
        </Typography>
      </Box>
    );
  }

  const handleRemove = async (productId) => {
    try {
      setLoadingStatus(true);
      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_ENDPOINT}/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get(
              import.meta.env.VITE_TOKEN_KEY
            )}`,
          },
        }
      );
      if (response.data.status) {
        setData(data.filter((item) => item._id !== productId));
        setAlertBoxOpenStatus(true);
        setAlertSeverity("success");
        setAlertMessage(response.data.message);
      } else {
        setLoadingStatus(false);
        console.log(response.data);
        setAlertBoxOpenStatus(true);
        setAlertSeverity("error");
        setAlertMessage(response.data.message);
      }
    } catch (error) {
      console.log(error);
      setLoadingStatus(false);
      setAlertBoxOpenStatus(true);
      setAlertSeverity("error");
      setAlertMessage("Something Went Wrong");
      error.response.data.message
        ? setAlertMessage(error.response.data.message)
        : setAlertMessage(error.message);
    }
  };


const handleEditProduct = async (productId, formData) => {
  try {
    setLoadingStatus(true);

    const response = await axios.patch(
      `${import.meta.env.VITE_SERVER_ENDPOINT}/products/${productId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${Cookies.get(
            import.meta.env.VITE_TOKEN_KEY
          )}`,
        },
      }
    );

    if (response.data.status) {
      const updatedProduct = response.data.product; // ✅ IMPORTANT

      setData((prev) =>
        prev.map((p) =>
          p._id === updatedProduct._id ? updatedProduct : p
        )
      );

      setAlertSeverity("success");
      setAlertMessage(response.data.message);
    }
  } catch (err) {
    console.error(err);
    setAlertSeverity("error");
    setAlertMessage("Update failed");
  } finally {
    setLoadingStatus(false);
    setAlertBoxOpenStatus(true);
  }
};


  return (
    <Box
      sx={{
        height: "88vh",
        overflowY: "scroll",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      <Grid container spacing={3} paddingBottom={5}>
        {data.map((product) => (
          <Grid item key={product._id} xs={12} sm={6} md={4}>
            <Card>
              <Box
                sx={{
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={`${
                    import.meta.env.VITE_SERVER_ENDPOINT
                  }/productimage/${product.image}`}
                  alt={product.title}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    display: "flex",
                    justifyContent: "flex-end",
                    flexDirection: "row",
                  }}
                >
                  <IconButton
                    sx={{
                      color: "green",
                      backgroundColor: "white",
                      marginRight: "5px",
                      "&:hover": { backgroundColor: "white" },
                    }}
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    sx={{
                      color: "red",
                      backgroundColor: "white",
                      "&:hover": { backgroundColor: "white" },
                    }}
                    onClick={() => handleRemove(product._id)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
              <Link
                to={`/products/${product._id}`}
                style={{ textDecoration: "none" }}
              >
                <CardContent
                  sx={{
                    paddingBottom: "12px !important",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h6" color="#59e3a7">
                      {product.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      color="#59e3a7"
                    >
                      ${product.price}
                    </Typography>
                  </Box>
                </CardContent>
              </Link>
            </Card>
          </Grid>
        ))}
      </Grid>
  <EditProductModal
  open={isEditOpen}
  product={selectedProduct}
  onClose={() => {
    setIsEditOpen(false);
    setSelectedProduct(null);
  }}
  onSave={handleEditProduct}
  // onProductUpdated={handleProductUpdated}
/>

    </Box>
  );
};

export default MyProduct;
