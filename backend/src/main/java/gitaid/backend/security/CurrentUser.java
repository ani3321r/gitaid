package gitaid.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import gitaid.backend.exceptions.UnauthorizedException;

public class CurrentUser {
  public AppUserPrincipal require(){
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if(auth == null || !(auth.getPrincipal() instanceof AppUserPrincipal principal)){
      throw new UnauthorizedException("Not Authenticated");
    }
    return principal;
  }
}
