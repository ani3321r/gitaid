package gitaid.backend.services;

import java.util.UUID;

import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gitaid.backend.entity.User;
import gitaid.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor 
public class UserServices {
  public final UserRepository userRepository;
  public final TextEncryptor tokenEncryptor;

  @Transactional (readOnly = true)
  public User requiredById(UUID id){
    return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
  }

  public String decryptAccessToken(User user){
    return tokenEncryptor.decrypt(user.getAccessToken());
  }

  private static Long toLong(Object value){
    if(value instanceof Number number){
      return number.longValue();
    }
    return Long.parseLong(String.valueOf(value));
  }
}
