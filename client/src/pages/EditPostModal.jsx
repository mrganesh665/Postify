import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip, Box, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import SimpleMdeReact from "react-simplemde-editor";
import useThinkify from "../hooks/useThinkify";

const EditPostModal = ({ open, onClose, post, onPostUpdated }) => {
  const { setLoadingStatus, setAlertBoxOpenStatus, setAlertMessage, setAlertSeverity } =
    useThinkify();

  const { register, handleSubmit, setValue, setError, clearErrors, formState: { errors } } =
    useForm();

  const [tag, setTag] = useState("");
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");




  // 🔹 Prefill data when modal opens
  useEffect(() => {
    if (post) {
      setValue("title", post.title);
      setTags(post.tags || []);
      setDescription(post.description || "");
    }
  }, [post]);

  // 🔹 Tags
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && tag.trim()) {
      e.preventDefault();
      if (!tags.includes(tag.trim())) {
        setTags([...tags, tag.trim()]);
      }
      setTag("");
      clearErrors("tags");
    }
  };

  const handleRemoveTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // 🔹 Submit edit
  const onSubmit = async (data) => {

    if (!tags.length) {
      setError("tags", { message: "At least one tag required" });
      return;
    }

    if (!description.trim()) {
      setError("description", { message: "Description required" });
      return;
    }

    try {
      setLoadingStatus(true);

      const response = await axios.patch(
        `${import.meta.env.VITE_SERVER_ENDPOINT}/posts/${post._id}`,
        {
          title: data.title,
          tags,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get(
              import.meta.env.VITE_TOKEN_KEY
            )}`,
          },
        }
      );

      if (response.data.status) {
        onPostUpdated(response.data.post || {
          ...post,
          title: data.title,
          tags,
          description,
        });

        setAlertSeverity("success");
        setAlertMessage("Post updated successfully");
        onClose();
      } else {
        setAlertSeverity("error");
        setAlertMessage(response.data.message);
      }

      setAlertBoxOpenStatus(true);
    } catch (error) {
           console.error("Edit submit error>>><<<<:", error);
      setAlertSeverity("error");
      setAlertMessage(
        error?.response?.data?.message || "Update failed"
      );
      setAlertBoxOpenStatus(true);
    } finally {
      setLoadingStatus(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Post</DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            {...register("title", { required: "Title is required" })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />

          {/* Tags */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {tags.map((t, i) => (
                <Chip key={i} label={t} onDelete={() => handleRemoveTag(i)} />
              ))}
            </Box>

            <TextField
              placeholder="Add tag and press Enter"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              sx={{ mt: 1 }}
            />

            {errors.tags && (
              <Typography color="error">{errors.tags.message}</Typography>
            )}
          </Box>

          {/* Description */}
          <Box sx={{ mt: 3 }}>
            <SimpleMdeReact value={description} onChange={setDescription} />
            {errors.description && (
              <Typography color="error">{errors.description.message}</Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Update
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditPostModal;
