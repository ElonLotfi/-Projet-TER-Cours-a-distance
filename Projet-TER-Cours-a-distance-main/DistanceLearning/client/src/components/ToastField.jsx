import { toast } from "react-toastify";

function Toast(message) {
  return toast.info(message, {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    });
}

export default {
  Toast
};