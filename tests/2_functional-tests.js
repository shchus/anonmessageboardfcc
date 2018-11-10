/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

var id; 
var replie_thread_id = '5be73143a1252f2e8e05dc55'; 
var replie_id;
var password = 'test_password';

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('post new thread', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({
            text: 'test text', 
            delete_password: 'test_password'
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isNull(err);
            assert.notEqual(res.text, 'empty fields');
            done();
          });
      }); 
    });
    
    suite('GET', function() {
      test('get the board', function(done) {
        chai.request(server)
          .get('/api/threads/test')  
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isNull(err);
            assert.isArray(res.body);
            id = res.body[0]._id;
            done();
          });
      });
    });
    
    suite('PUT', function() {
      test('reported a thread', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({report_id: id})
          .end(function(err, res){
            assert.equal(res.status, 200); 
            assert.isNull(err);
            assert.equal(res.text, 'success');
            done();
          });
      });
    });
    
    suite('DELETE', function() {
     test('delete a thread', function(done) {
       chai.request(server)
         .delete('/api/threads/test')
         .send({
           thread_id: id, 
           delete_password: password
         })
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.isNull(err);
           assert.equal(res.text, 'success');
           done();
       });  
     });
    });        

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('post new replie', function(done) {       
        chai.request(server)
          .post('/api/replies/test')
          .send({
            board : 'test',
            thread_id: replie_thread_id,
            text: 'test replie', 
            delete_password: password
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isNull(err);
            assert.notEqual(res.text, 'error');
            done();
          });
      });       
    });
    
    suite('GET', function() {
      test('get the replies', function(done) {
        chai.request(server)
          .get('/api/replies/test') 
          .query({thread_id: replie_thread_id})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isNull(err);
            assert.isObject(res.body);
            replie_id = res.body.replies[0]._id;
            done();
          });
      });     
    });
    
    suite('PUT', function() {
      test('reported a replie', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({reply_id: replie_id})
          .end(function(err, res){
            assert.equal(res.status, 200); 
            assert.isNull(err);
            assert.equal(res.text, 'success');
            done();
          });
      });      
    });
    
    suite('DELETE', function() {
     test('delete a replie', function(done) {
       chai.request(server)
         .delete('/api/replies/test')
         .send({
           reply_id: replie_id, 
           delete_password: password
         })
         .end(function(err, res){
           assert.equal(res.status, 200);
           assert.isNull(err);
           assert.equal(res.text, 'success');
           done();
       });  
     });      
    });
    
  });


})