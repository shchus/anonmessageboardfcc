/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

//connect the db
var db;
MongoClient.connect(process.env.DB, function(err, DB) {
  if (!err) {
    db = DB;
    //console.log('connected');
  } else {
    console.log(err);
  }
});

var sortByDate = (d1, d2) => new Date(d1.bumped_on).getTime() - new Date(d2.bumped_on).getTime();
function promise(c, search) {
  return new Promise((resolve, reject) => {
    db.collection(c).find(search).toArray((err, data) => {
      //db.close();   
      if (err) {
        reject(err);
      } else {
        resolve(data);                                        
      }
    })
  })
}

module.exports = function (app) {
  app.route('/api/threads/:board')
    .get(function (req, res) { 
      let board = req.params.board;
      if (board) {
        let j = [];
        promise('threads', {board:board}).then(data => {
          data.sort(sortByDate).forEach((e) => {
            if (e.type == 'thread') { // if obj isn't a comment
              j = [...j, {
                    _id: e._id,
                    text: e.text, 
                    created_on: e.created_on,
                    bumped_on: e.bumped_on,
                    replies: e.replies.slice(-3),
                    replycount: e.replies.length
                  }]  
            }
          })
          j = j.slice(-10); // last 10 threads
                   
          j.forEach((t, i) => {
            let comments = [];
            if (t.replies.length > 0) { // if the thread has comments
              t.replies.forEach((c_id) => {
                data.sort(sortByDate).forEach((d) => {
                  if (d.type == 'comment' && d._id.toString() == c_id) {
                    comments = [...comments, {_id:d._id, text:d.text, created_on:d.created_on}]
                  }
                })
              })
            }            
            j[i]['replies'] = comments;
          })
          res.json(j);
        })
        .catch(err => {    
          console.log(err);
        })
      };    
    })
    .post(function (req, res) {
      let board = req.body.board || req.params.board;
      let text = req.body.text;
      let password = req.body.delete_password;
      if (board && text && password) {
        db.collection('threads').insertOne({
          board: board,
          type: 'thread',
          text: text, 
          created_on: new Date(), 
          bumped_on: new Date(), 
          reported: false, 
          delete_password: password, 
          replies: []
        }, (err, data) => {
          if (!err) {
            res.redirect('/b/' + board + '/');
          }
        })
      } else { // if empty fields
        res.type('txt').send('empty fields');
      }          
    })
    .put(function (req, res) {
      let board = req.params.board;
      let report_id = req.body.report_id || req.body.thread_id;      
      if (ObjectId.isValid(report_id)) {
        db.collection('threads').update(
          {_id:ObjectId(report_id), board:board},
          {$set: {reported:true}},
          (err, data) => {
            if (!err) {
              res.type('txt').send( 'success');
            }
          }
        );
      };
    })
    .delete(function (req, res) {
      let board = req.params.board;
      let thread_id = req.body.thread_id;
      let password = req.body.delete_password;           
      if (ObjectId.isValid(thread_id)) {
        db.collection('threads').findOne({_id:ObjectId(thread_id), board:board}, (err, data) => {
          if (!err && data.delete_password == password) {
            db.collection('threads').deleteOne({_id:ObjectId(thread_id), board:board}, (err, data) => {
              if (!err) {
                res.type('txt').send('success');
              }
            });
          } else {
            res.type('txt').send('incorrect password');
          };
        });
      };
    });
  app.route('/api/replies/:board')
    .get(function (req, res) {
      let board = req.params.board;
      let thread_id = req.query.thread_id;
      if (ObjectId.isValid(thread_id)) {
        db.collection('threads').findOne({_id:ObjectId(thread_id)}, (err, data) => {
          let j;
          let comments = [];
          if (!err && data) { 
                j = {_id: data._id,
                    text: data.text, 
                    created_on: data.created_on,
                    bumped_on: data.bumped_on,
                    replies: [],
                    replycount: data.replies.length} 
            //if (data.replies.length > 0) { 
              db.collection('threads').find({thread_id:thread_id}).toArray((err, data) => {                 
                data.forEach((c) => {
                  comments = [...comments, {_id:c._id, text:c.text, created_on:c.created_on}]
                })
                j['replies'] = comments;
                res.json(j);
              })
            //}
          }
        })
      }
    }) 
    .post(function (req, res) {
      let board = req.body.board || req.params.board;
      let thread_id = req.body.thread_id;
      let text = req.body.text;
      let password = req.body.delete_password;
      if (ObjectId.isValid(thread_id)) {
        db.collection('threads').insertOne({ // add a comment
          board:board,
          type: 'comment',
          thread_id:thread_id,
          text:text,
          delete_password: password,
          created_on: new Date(),
          reported: false 
        }, (err, data) => {
          if (!err) { // bump the thread
            db.collection('threads').update(
              {_id:ObjectId(thread_id), board:board, type:'thread'}, // find
              {$set: {bumped_on: data.ops[0].created_on}, // update 
               $push: {replies: data.ops[0]._id}
              }, (err, data) => {
                if (!err) {
                  res.redirect('/b/' + board + '/' + thread_id);  
                } else {
                  res.type('txt').send('error');
                }
              }
            );
          }
        });         
      }
    })
    .put(function (req, res) {
      let comment_id = req.body.reply_id;
      if (ObjectId.isValid(comment_id)) {        
        db.collection('threads').update(
          {_id:ObjectId(comment_id)}, 
          {$set: {reported:true}},
          (err, data) => {
            if (!err) {
              res.type('txt').send( 'success');
            }
          }          
        )
      }
    })
    .delete(function (req, res) {
      let comment_id = req.body.reply_id;
      let password = req.body.delete_password;      
      if (ObjectId.isValid(comment_id)) {
        db.collection('threads').findOne({_id:ObjectId(comment_id)}, (err, data) => {
            if (!err && data.delete_password == password) {
              db.collection('threads').update(
                {_id:ObjectId(comment_id)}, 
                {$set: {text: '[DELETED]'}},
                (err, data) => {
                  if (!err) {
                    res.type('txt').send('success');
                  } else {
                    res.type('txt').send('incorrect password');
                  }
              })        
            } else {
              res.type('txt').send('incorrect password');
            }
        })
      } else {
        res.type('txt').send('incorrect password');
      }
    });
};