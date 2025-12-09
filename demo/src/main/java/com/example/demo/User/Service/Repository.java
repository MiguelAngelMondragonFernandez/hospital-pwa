package com.example.demo.User.Service;

import com.example.demo.User.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface Repository extends JpaRepository<User, Long> {

    @Query(nativeQuery = true, value = "SELECT need_authentication FROM users WHERE username = ?1")
    Boolean isAuthenticationNeeded(String username);

    @Query(nativeQuery = true, value = "SELECT * FROM users WHERE username = ?1 AND password = ?2")
    User Login(String username, String password);

    @Query(nativeQuery = true, value = "SELECT * FROM users WHERE username = ?1")
    User findByUsername(String username);

    @Query(nativeQuery = true, value = "SELECT * FROM users WHERE role = ?1")
    java.util.List<User> findAllByRole(String role);
}
