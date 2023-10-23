import Layout from '../../components/layout/layout';
import { getAllPostIds, getFilteredPosts, getPostData } from '../../lib/posts';
import Head from 'next/head';
import Date from '../../components/date/date';
import utilStyles from '../../styles/utils.module.css';
import { GetStaticProps, GetStaticPaths } from 'next';
import Link from 'next/link';
import style from '../../components/layout/layout.module.css';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import rehypePrism from 'rehype-prism-plus';
import rehypeCodeTitles from 'rehype-code-titles';
import { postProcess, preProcess } from '../../lib/rehype-pre-raw';
import { Pre } from '../../components/pre/pre-component';
import { gsap } from 'gsap/dist/gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useEffect } from 'react';
import { timeToRead } from '../../lib/timeToRead';
import FilteredPosts from './filtered/[tag]';

const custom = {
  pre: (props) => <Pre {...props}/>
}

export default function Post({
  postData,
}: {
  postData: {
    title: string;
    date: string;
    contentHtml: MDXRemoteSerializeResult;
    tags: string[];
    img: string;
    timeToRead: number;
    relatedPosts: [
      {
        title: string;
        date: string;
        id: string;
        contentHtml: string;
      }
    ]
  };
}) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to('progress', {
      value: 100,
      scrollTrigger: {
        scrub: 0.5,
      }
    });
  }, []);

  return (
    <Layout >
      <Head>
        <meta property="og:image" content={postData.img} />
        <title>{postData.title}</title>
      </Head>
      <progress max={100} value={0} className={utilStyles.progress}></progress>
      <article>
        <div className={style.zContainer}>
          {postData.img && (
            <img src={postData.img} alt={postData.title} className={style.postImg}/>
          )}
        </div>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <div className={`${utilStyles.lightText} ${utilStyles.topicInfo}`}>
          <Date dateString={postData.date} />
          <div className={utilStyles.separator}></div>
          <div>{postData.timeToRead} min read</div>
        </div>
        <div>
          <MDXRemote {...postData.contentHtml} components={{ ...custom }}/>
        </div>
        <div className={utilStyles.tagsL}>{postData.tags.map((tag, i) => (
            <div className={utilStyles.tagL} key={i}>
              <Link 
                href={`/posts/filtered/${tag.replace('#', '').toLowerCase()}`}
                className={utilStyles.colorInherit}
              >
                <div className={utilStyles.tagTextL}>{tag}</div>
              </Link>
            </div>
        ))}</div>
        {postData.relatedPosts.length > 0 ? (<h3>
            Related topics
        </h3>) : <></>}
        <div className={utilStyles.cardsContainer}>
          {postData.relatedPosts.map((relatedPost, index) => (
            <div className={utilStyles.card} key={index}>
              <Link 
                href={`/posts/${relatedPost.id}`}
                className={`${utilStyles.colorInherit} ${utilStyles.postLink}`}
              >
                <h4>
                  {relatedPost.title}
                </h4>
              </Link>
              <div className={`${utilStyles.lightText} ${utilStyles.topicInfo}`}>
                <Date dateString={relatedPost.date} />
                <div className={utilStyles.separator}></div>
                <div>{timeToRead(relatedPost.contentHtml)} min read</div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postData = await getPostData(params?.id as string);
  let relatedPosts: any[] = [];

  for (const relatedPostTag of postData.tags.slice(0, 3)) {
    const relatedPost = await getFilteredPosts(relatedPostTag.replace('#', '').toLowerCase());
    relatedPosts.push(relatedPost);
  }
  let uniquePosts: any = [];
  Array.from(new Set(relatedPosts.map((post) => post.id))).map((id) => {
    const post =  relatedPosts.find((post) => post.id === id);
    uniquePosts = post.map(obj => obj);
  });
  uniquePosts = uniquePosts.filter((post) => post.id !== postData.id);
  const filteredUniquePosts = uniquePosts.slice(0, 3);

  const timeToReadArticle = timeToRead(postData.contentHtml);
  const html = await serialize(postData.contentHtml, { mdxOptions: {
    rehypePlugins: [
      preProcess,
      rehypeCodeTitles,
      rehypePrism as any,
      postProcess,
    ]
  }});

  return {
    props: {
      postData: {
        title: postData.title,
        date: postData.date,
        contentHtml: html,
        tags: postData.tags,
        img: postData.img,
        timeToRead: timeToReadArticle,
        relatedPosts: filteredUniquePosts
      }
    },
  };
};