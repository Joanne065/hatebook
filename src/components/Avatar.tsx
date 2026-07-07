import { useEffect, useState } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import avatarManifest from '../data/avatar-manifest.json';
import type { Author } from '../types';
import { fetchAuthorAvatar, getCachedAvatar, setCachedAvatar } from '../utils/avatarFetch';
import { AUTHOR_AVATARS, getAvatarFallback, publicAssetUrl } from '../utils/helpers';

const LOCAL_AVATARS: Record<string, string> = avatarManifest as Record<string, string>;
const HAN_KANG_ID = '한강';

function resolveStaticUrl(author: Author): string | null {
  if (author.avatarUrl) return author.avatarUrl;
  if (LOCAL_AVATARS[author.id]) return publicAssetUrl(LOCAL_AVATARS[author.id]);
  if (AUTHOR_AVATARS[author.id]) return AUTHOR_AVATARS[author.id];
  return getCachedAvatar(author.id);
}

interface AvatarProps {
  author: Author;
  size?: number;
  to?: string;
  linkState?: LinkProps['state'];
  onClick?: () => void;
}

export function Avatar({ author, size = 40, to, linkState, onClick }: AvatarProps) {
  const [url, setUrl] = useState<string | null>(() => resolveStaticUrl(author));
  const [failed, setFailed] = useState(false);
  const fallback = getAvatarFallback(author.nameCn, author.nameEn);
  const fallbackSize = fallback.length > 1 ? size * 0.22 : size * 0.38;

  useEffect(() => {
    setFailed(false);
    const staticUrl = resolveStaticUrl(author);
    if (staticUrl) {
      setUrl(staticUrl);
      return;
    }
    let cancelled = false;
    void fetchAuthorAvatar(author.id, author.nameCn, author.nameEn).then((fetched) => {
      if (!cancelled && fetched) {
        setCachedAvatar(author.id, fetched);
        setUrl(fetched);
      }
    });
    return () => { cancelled = true; };
  }, [author.id, author.nameCn, author.nameEn, author.avatarUrl]);

  const handleError = () => {
    if (author.id === HAN_KANG_ID) {
      setFailed(true);
      return;
    }
    if (!failed && url) {
      void fetchAuthorAvatar(author.id, author.nameCn, author.nameEn, true).then((fetched) => {
        if (fetched && fetched !== url) {
          setCachedAvatar(author.id, fetched);
          setUrl(fetched);
          setFailed(false);
          return;
        }
        setFailed(true);
      });
    } else {
      setFailed(true);
    }
  };

  const content = (
    <div className="avatar" style={{ width: size, height: size }} onClick={onClick}>
      {url && !failed ? (
        <img
          src={url}
          alt={author.nameCn}
          className="avatar-img"
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      ) : (
        <span className="avatar-fallback" style={{ fontSize: fallbackSize }}>{fallback}</span>
      )}
    </div>
  );

  if (to) return <Link to={to} className="avatar-link" state={linkState}>{content}</Link>;
  return content;
}
