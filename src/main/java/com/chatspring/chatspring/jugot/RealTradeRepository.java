package com.chatspring.chatspring.jugot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RealTradeRepository extends JpaRepository<RealTrade, Long> {
    // ACTIVE 상태인 실매매 목록 조회
    List<RealTrade> findByStatusOrderByCreatedAtDesc(String status);
    
    // 참여자 정보를 함께 조회 (fetch join)
    @Query("SELECT DISTINCT rt FROM RealTrade rt LEFT JOIN FETCH rt.participants p LEFT JOIN FETCH p.user WHERE rt.id = :id")
    Optional<RealTrade> findByIdWithParticipants(@Param("id") Long id);
    
    // 모든 실매매를 참여자 정보와 함께 조회 (fetch join)
    @Query("SELECT DISTINCT rt FROM RealTrade rt LEFT JOIN FETCH rt.participants p LEFT JOIN FETCH p.user")
    List<RealTrade> findAllWithParticipants();
    
    // 상태별 실매매를 참여자 정보와 함께 조회 (fetch join)
    @Query("SELECT DISTINCT rt FROM RealTrade rt LEFT JOIN FETCH rt.participants p LEFT JOIN FETCH p.user WHERE rt.status = :status ORDER BY rt.createdAt DESC")
    List<RealTrade> findByStatusWithParticipantsOrderByCreatedAtDesc(@Param("status") String status);
}






