package org.springframework.samples.pubus.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.util.ContentCachingResponseWrapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class ResponseLoggingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(ResponseLoggingInterceptor.class);

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        if (request.getRequestURI().equals("/api/v1/papers") && request.getMethod().equals("POST")) {
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
            // Necesitas leer el contenido ANTES de que se envíe
            byte[] responseArray = responseWrapper.getContentAsByteArray();
            String responseBody = new String(responseArray, response.getCharacterEncoding());
            logger.info("Respuesta POST /api/v1/papers: Status={}, Body='{}'", response.getStatus(), responseBody);
            responseWrapper.copyBodyToResponse(); // Importante para que la respuesta siga su curso
        }
    }
}