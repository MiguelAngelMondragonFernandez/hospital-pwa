package com.example.demo.Notification.Repository;

import com.example.demo.Notification.Entity.PushSubscription;
import com.example.demo.User.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    List<PushSubscription> findByUser(User user);

    Optional<PushSubscription> findByToken(String token);
}
