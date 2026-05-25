'use strict';

module.exports = (io) => {

  // Managers — join their org room, receive risk and donation events
  io.of('/manager').on('connection', (socket) => {
    socket.on('join:org', (orgId) => {
      socket.join(`org:${orgId}`);
    });
    socket.on('disconnect', () => {});
  });

  // Charities — join city room, receive live donation map pins
  io.of('/charity').on('connection', (socket) => {
    socket.on('join:city', (city) => {
      socket.join(`city:${city}`);
    });
    socket.on('disconnect', () => {});
  });

  // Admins — network-wide events
  io.of('/admin').on('connection', (socket) => {
    socket.join('admin:network');
    socket.on('disconnect', () => {});
  });

};