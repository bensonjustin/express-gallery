const express = require('express');
const router = express.Router();
const Gallery = require('../db/models/Gallery.js');

router.get('/new', (req, res) => {
  res.render('new', { gallery: Gallery });
});

router.get('/', (req, res) => {
  Gallery.fetchAll().then(results => {
    let detailArr = [];
    for (let i = 0; i < results.length; i++) {
      // console.log(results.models[i].attributes);
      let detail = {
        id: results.models[i].attributes.id,
        author: results.models[i].attributes.author,
        link: results.models[i].attributes.link,
        description: results.models[i].attributes.description
      };
      detailArr.push(detail);
    }
    return res.render('gallery', { gallery: detailArr });
  });
});

router.get('/:id', (req, res) => {
  Gallery.where({ id: req.params.id })
    .fetch()
    .then(results => {
      const detail = {
        id: results.attributes.id,
        author: results.attributes.author,
        link: results.attributes.link,
        description: results.attributes.description
      };
      return res.render('./photo', detail);
    });
});

router.get('/:id/edit', (req, res) => {
  Gallery.where({ id: req.params.id })
    .fetch()
    .then(results => {
      const detail = {
        id: results.attributes.id,
        author: results.attributes.author,
        link: results.attributes.link,
        description: results.attributes.description
      };
      return res.render('./edit', detail);
    });
});

router.post('/', (req, res) => {
  Gallery.forge({
    user_id: req.user.id,
    author: req.body.author,
    link: req.body.link,
    description: req.body.description
  })
    .save()
    .then(results => {
      return res.redirect(`/gallery/${results.id}`);
    });
});

router.put('/:id', (req, res) => {
  Gallery.where({ id: req.params.id })
    .fetch()
    .then(results => {
      new Gallery({ id: req.params.id })
        .save({
          user_id: req.user.id,
          author: req.body.author,
          link: req.body.link,
          description: req.body.description
        })
        .then(results => {
          return res.redirect(`/gallery/${results.id}`);
        });
    });
});

router.delete('/:id', (req, res) => {
  Gallery.where({ id: req.params.id })
    .fetch()
    .then(results => {
      new Gallery({ id: req.params.id }).destroy().then(results => {
        return res.redirect('/gallery');
      });
    });
});

module.exports = router;
