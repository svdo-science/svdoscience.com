import React from 'react'
import PropTypes from 'prop-types'
import { graphql } from 'gatsby'

import SEO from '../components/seo'
import Layout from '../components/layout'
import Post from '../components/post'

const BlogPostTemplate = ({ data, pageContext }) => {
  if (!data.markdownRemark) {
    console.log('Ah crap...')
    data.markdownRemark = {
      frontmatter: {
        title: "Missing Title",
        date: new Date().toISOString().slice(0,10),
        path: "",
        author: "Joel",
        coverImage: {
          childImageSharp: {
            gatsbyImageData: {
              src: "/images/hello.jpg"
            }
          }
        },
        excerpt: "Missing excerpt",
        tags: [""],
      },
      excerpt: {},
      id: "0",
      html: "<html><body><div><h1>Missing</h1></div></body></html>",
    }
  }
  const {
    frontmatter: { title, date, path, author, coverImage, excerpt, tags },
    excerpt: autoExcerpt,
    id,
    html,
  } = data.markdownRemark
  const { next, previous } = pageContext

  return (
    <Layout>
      <SEO title={title} description={excerpt || autoExcerpt} />
      <Post
        key={id}
        title={title}
        date={date}
        path={path}
        author={author}
        coverImage={coverImage}
        html={html}
        tags={tags}
        previousPost={previous}
        nextPost={next}
      />
    </Layout>
  )
}

export default BlogPostTemplate

BlogPostTemplate.propTypes = {
  data: PropTypes.object.isRequired,
  pageContext: PropTypes.shape({
    next: PropTypes.object,
    previous: PropTypes.object,
  }),
}

export const pageQuery = graphql`query ($path: String) {
  markdownRemark(frontmatter: {path: {eq: $path}}) {
    frontmatter {
      title
      date(formatString: "DD MMMM YYYY")
      path
      author
      excerpt
      tags
      coverImage {
        childImageSharp {
          gatsbyImageData(width: 800, layout: CONSTRAINED)
        }
      }
    }
    id
    html
    excerpt
  }
}`
