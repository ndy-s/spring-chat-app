package com.hendy.spring_chat_app.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String errorMessage = "Something went wrong!";

        if (status != null) {
            int statusCode = Integer.parseInt(status.toString());
            model.addAttribute("statusCode", statusCode);

            // Set custom error messages based on status code
            errorMessage = switch (statusCode) {
                case 404 -> "Page not found.";
                case 500 -> "Internal server error.";
                case 403 -> "Access denied.";
                default -> "Unexpected error.";
            };
        }

        model.addAttribute("errorMessage", errorMessage);
        return "error";
    }
}
