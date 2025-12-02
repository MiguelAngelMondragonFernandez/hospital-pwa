package com.example.demo.utils;

public class Message {
    public String message;
    public Object data;
    public boolean error;

    public Message(String message, Object data) {
        this.message = message;
        this.data = data;
    }

    public Message(String message){
        this.message = message;
    }

    public Message(String message, Object data, boolean error) {
        this.message = message;
        this.data = data;
        this.error = error;
    }


    public Message() {}
}
