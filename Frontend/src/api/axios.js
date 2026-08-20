import axios from "axios";

const api = axios.create({
  baseURL: "https://deepsync-backend.onrender.com",
  timeout: 30000,
});

/*
 * 요청 보내기 전 처리
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    /*
     * JWT가 있으면 Authorization 자동 추가
     */
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /*
     * FormData 요청은 Content-Type을 직접 지정하면 안 됨.
     *
     * 브라우저가
     * multipart/form-data; boundary=....
     * 형태로 자동 생성해야 함.
     */
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    console.log("API 요청:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: Boolean(token),
      isFormData: config.data instanceof FormData,
    });

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/*
 * 응답 처리
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;

    console.error("API 요청 실패:", {
      status,
      url: requestUrl,
      data: error.response?.data,
    });

    /*
     * 로그인 API 자체가 401일 때는
     * 로그인 만료 메시지를 띄우면 안 됨.
     */
    const isLoginRequest = requestUrl?.includes("/api/v1/auth/login");

    if (status === 401 && !isLoginRequest) {
      const token = localStorage.getItem("accessToken");

      /*
       * 토큰이 아예 없는 경우
       */
      if (!token) {
        if (window.location.pathname !== "/login") {
          alert("로그인이 필요합니다.");
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }

      /*
       * 토큰이 있는데 서버가 401을 반환한 경우
       *
       * 실제 JWT 오류를 콘솔에서 먼저 확인 가능하게 함.
       */
      console.error("JWT가 존재하지만 서버에서 401을 반환했습니다.", {
        requestUrl,
        tokenLength: token.length,
        response: error.response?.data,
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("expiresIn");
      localStorage.removeItem("rememberLogin");

      if (window.location.pathname !== "/login") {
        alert("인증 정보가 유효하지 않습니다. 다시 로그인해주세요.");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
