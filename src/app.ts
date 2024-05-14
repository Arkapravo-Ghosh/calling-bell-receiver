import mqtt from "mqtt";
import rpio from "rpio";
import fs from "fs";
import { Config, Data } from "./types";

// Configuration
let config: Config;
const configLocation = process.env.CONFIG_PATH || "config.json";
config = JSON.parse(fs.readFileSync(configLocation, "utf8"));
rpio.open(config.buzzer.pin, rpio.OUTPUT, rpio.LOW);
config.pinConfig.forEach((pin) => {
  rpio.open(pin.pin, rpio.OUTPUT, rpio.LOW);
});

// MQTT Configuration
const mqttOptions = {
  host: process.env.MQTT_HOST || "localhost",
  port: process.env.MQTT_PORT || 1883,
  protocol: process.env.MQTT_SECURE === "true" ? "mqtts" : "mqtt" || "mqtt",
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWD,
};

const mqttClient = mqtt.connect(`${mqttOptions.protocol}://${mqttOptions.host}:${mqttOptions.port}`, {
  username: mqttOptions.username,
  password: mqttOptions.password,
});

const mqttTopic = process.env.MQTT_TOPIC || "/test";

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

const buzz = async () => {
  const timeOut = 1;
  const buzzCount = 5;
  for (let i = 0; i < buzzCount; i++) {
    rpio.open(config.buzzer.pin, rpio.OUTPUT, rpio.HIGH);
    await new Promise((resolve) => setTimeout(resolve, timeOut * 100));
    rpio.open(config.buzzer.pin, rpio.OUTPUT, rpio.LOW);
    await new Promise((resolve) => setTimeout(resolve, timeOut * 100));
  };
};

// MQTT Listener
mqttClient.subscribe(mqttTopic, (err) => {
  if (err) {
    console.error("Error subscribing to topic", err);
  } else {
    console.log("Subscribed to topic", mqttTopic);
    mqttClient.on("message", (topic, message) => {
      try {
        const data: Data = JSON.parse(message.toString());
        console.log(topic, data.id, data.operation);
        const pin = config.pinConfig.find((pin) => pin.id === data.id);
        if (pin) {
          if (data.operation === "on") {
            rpio.open(pin.pin, rpio.OUTPUT, rpio.HIGH);
            buzz();
          } else if (data.operation === "off") {
            rpio.open(pin.pin, rpio.OUTPUT, rpio.LOW);
          };
        };
      } catch (err) {
        console.log("Error parsing message", err);
      };
    });
  };
});