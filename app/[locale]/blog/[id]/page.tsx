import PostBody from "@/components/posts/post-body";
import { getPostBySlug, getRelatedPosts as getRelatedPostsById } from "../../../lib/posts";
import Tags from "@/components/posts/tags";
import RelatedPosts from "@/components/posts/related-posts";
import NavigationButtons from "@/components/scroll-to-top";
import { getHeadings } from "@/app/lib/mdx-headings";
import ScrollBar from "@/components/blog-items/scroll";
import Comments from "@/components/comments";
import LikePost from "@/components/like-post";
import dynamic from "next/dynamic";

const domain = process.env.DOMAIN as string;

const getPageContent = async (slug: string) => {
  const { meta, content, fileContent, description } = await getPostBySlug(slug);
  return { meta, content, fileContent, description };
}

const getRelatedPosts = async (slug: string) => getRelatedPostsById(slug);

export async function generateMetadata({ params } : { params: { id: string } }) {
  const { meta } = await getPageContent(params.id);
  return { title: meta.title };
}

const NoSSR = dynamic(() => import('../../../../components/share-social-links'), { ssr: false })

export default async function BlogPost({ params } : { params: { id: string } }) {
  const { meta, content, fileContent, description } = await getPageContent(params.id);
  const relatedPosts = await getRelatedPosts(params.id);
  const headings = await getHeadings(params.id);
  
  return (
    <article>
      <ScrollBar />
      <PostBody 
        meta={meta}
        content={content}
        fileContent={fileContent}
        nodes={headings}
      />
      <Tags
        tags={meta.tags}
      />
      <div className="items-center flex justify-center">
				<hr className="w-[50%] mt-10" />
			</div>
      <div className="md:flex md:justify-between justify-center m-10">
        <LikePost 
          postId={meta.slug}
        />
        <NoSSR 
          slug={meta.slug}
          title={meta.title}
          domain={domain}
          description={description}
        />
      </div>
      <Comments />
      <div className="items-center flex justify-center">
        <RelatedPosts
          relatedPosts={relatedPosts}
        />
      </div>
      <NavigationButtons />
      <div className="items-center flex justify-center mt-10">
				<hr className="w-[50%]" />
			</div>
    </article>      
  );
}