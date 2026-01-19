import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  //baseURL: "https://e-com-backend-7fyb.onrender.com/api",
})

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token")
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status
      if (status === 401) {
        localStorage.removeItem("admin_token")
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      }
    }

    return Promise.reject(error)
  },
)
