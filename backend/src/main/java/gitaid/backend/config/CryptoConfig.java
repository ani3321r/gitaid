package gitaid.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@Configuration 
public class CryptoConfig {
  
  @Bean
  TextEncryptor tokenEncryptor(
    @Value("${app.token-encryptor-password}") String password,
    @Value("${app.token-encryptor-salt}") String salt){
      return Encryptors.text(password, salt);
    }
}
