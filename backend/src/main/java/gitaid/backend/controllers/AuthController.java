package gitaid.backend.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import gitaid.backend.dto.UserResponse;
import gitaid.backend.entity.User;
import gitaid.backend.security.AppUserPrincipal;
import gitaid.backend.security.CurrentUser;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;


@RestController 
@RequestMapping ("/api/auth")
@RequiredArgsConstructor 
public class AuthController {
  private final CurrentUser currentUser;

  @GetMapping("/login-url")
  public Map<String,String> loginUrl() {
      return Map.of("url", "/oauth2/authorization/github");
  }
  
  @GetMapping("/me")
  public ResponseEntity<UserResponse> me() {
    AppUserPrincipal principal = currentUser.require();
    User user = principal.getUser();  
    return ResponseEntity.ok(new UserResponse(
      user.getId(),
      user.getGithubId(),
      user.getGithubUsername(),
      user.getDisplayName(),
      user.getAvatarUrl()
  ));
  }
}
