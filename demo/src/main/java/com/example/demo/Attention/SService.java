package com.example.demo.Attention;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.example.demo.utils.Message;

import lombok.AllArgsConstructor;
import lombok.Data;

@Service
@Data
@AllArgsConstructor
public class SService {

    private final IRespository repository;

    public ResponseEntity<Message> findAllUnattended() {
        List<Bean> list = repository.findAllByStatusNot("Atendida");
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No hay solicitudes pendientes"), HttpStatus.OK);
        }
        return new ResponseEntity<>(new Message("Solicitudes encontradas", list), HttpStatus.OK);
    }

    public ResponseEntity<Message> findAll() {
        List<Bean> list = repository.findAll();
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No hay registros"), HttpStatus.OK);
        }
        return new ResponseEntity<>(new Message("Registros encontrados", list), HttpStatus.OK);
    }

    public ResponseEntity<Message> save(Dto dto) {
        Bean bean = new Bean();
        bean.setDateTime(dto.getDateTime());
        bean.setStatus(dto.getStatus());
        bean.setStretcherId(dto.getStretcherId());
        Bean bean2 = repository.save(bean);
        return new ResponseEntity<>(new Message("Datos guardados", bean2), HttpStatus.OK);
    }

    // Buscamos por idStretcher
    public ResponseEntity<Message> findAllByStretcherId(Long stretcherId) {
        List<Bean> list = repository.findAllByStretcherId(stretcherId);
        if (list.isEmpty()) {
            return new ResponseEntity<>(new Message("No se encontraron datos"), HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(new Message("Datos encontrados", list), HttpStatus.OK);
    }

    public ResponseEntity<Message> delete(Long id) {
        Bean bean = repository.findById(id).orElse(null);
        if (bean == null) {
            return new ResponseEntity<>(new Message("No se encontro el dato"), HttpStatus.NOT_FOUND);
        }
        repository.delete(bean);
        return new ResponseEntity<>(new Message("Datos eliminados"), HttpStatus.OK);
    }

    public ResponseEntity<Message> update(Long id, Dto dto) {
        Bean bean = repository.findById(id).orElse(null);
        if (bean == null) {
            return new ResponseEntity<>(new Message("No se encontro el dato"), HttpStatus.NOT_FOUND);
        }
        bean.setDateTime(dto.getDateTime());
        bean.setStatus(dto.getStatus());
        bean.setStretcherId(dto.getStretcherId());
        Bean bean2 = repository.save(bean);
        return new ResponseEntity<>(new Message("Datos actualizados", bean2), HttpStatus.OK);
    }

    public ResponseEntity<Message> markAsAttended(Long id) {
        Bean bean = repository.findById(id).orElse(null);
        if (bean == null) {
            return new ResponseEntity<>(new Message("No se encontro la solicitud"), HttpStatus.NOT_FOUND);
        }
        bean.setStatus("Atendida");
        Bean bean2 = repository.save(bean);
        return new ResponseEntity<>(new Message("Solicitud marcada como atendida", bean2), HttpStatus.OK);
    }
}
