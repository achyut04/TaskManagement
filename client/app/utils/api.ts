import axios, { AxiosError } from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object" && "success" in response.data) {
      if (response.status === 204) {
        return { ...response, data: null, meta: null };
      }
      return { 
        ...response, 
        data: response.data.data,
        meta: response.data.meta || null
      };
    }
    return response;
  },
  (error: AxiosError<any>) => {
    if (error.response?.data && typeof error.response.data === "object" && "success" in error.response.data && !error.response.data.success) {
      const errorData = error.response.data.error;
      const customError = new Error(errorData?.message || "An error occurred");
      (customError as any).code = errorData?.code;
      (customError as any).details = errorData?.details;
      (customError as any).response = error.response;
      return Promise.reject(customError);
    }
    return Promise.reject(error);
  }
);

export default API;
