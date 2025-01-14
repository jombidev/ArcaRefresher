import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { withStyles } from '@material-ui/styles';

import { TOASTBOX } from 'core/selector';
import { useLoadChecker } from 'util/LoadChecker';

import Info from '../FeatureInfo';
import { emoticonFilterSelector } from '../selector';

const style = {
  '@global': {
    '#toastbox': {
      '& .filtered-emoticon': {
        width: 'auto !important',
        height: 'auto !important',
        textDecoration: 'none !important',
        '&::after': {
          content: '"[아카콘 뮤트됨]"',
        },
        '& > img, & > video': {
          display: 'none !important',
        },
      },
    },
  },
};

function ToastMuter() {
  const { user, hideMutedMark } = useSelector(
    (state) => state[Info.ID].storage,
  );
  const toastboxLoaded = useLoadChecker(TOASTBOX);
  const filter = useSelector(emoticonFilterSelector);

  useEffect(() => {
    if (!toastboxLoaded) return null;

    const toastbox = document.querySelector(TOASTBOX);
    const observer = new MutationObserver(() => {
      // 이모티콘 뮤트 처리
      toastbox.querySelectorAll('img').forEach((img) => {
        const url = img.src.replace('https:', '');
        if (filter.url.indexOf(url) > -1) {
          img.parentNode.classList.add('filtered-emoticon');
        }
      });

      // 사용자 뮤트
      if (!user.length) return;
      toastbox.querySelectorAll('.toast').forEach((toast) => {
        const header = toast
          .querySelector('.toast-header > strong')
          .textContent.split('님의')[0];
        const body = toast.querySelector('.toast-body');
        const content = body.textContent.split('님의')[0];

        const regex = new RegExp(user.join('|'));
        if (regex.test(header) || regex.test(content)) {
          if (hideMutedMark) {
            toast.remove();
            return;
          }

          body.textContent = '[뮤트된 이용자의 알림]';
        }
      });

      if (toastbox.childElementCount === 0) {
        toastbox.style.dispaly = 'none';
      }
    });
    observer.observe(toastbox, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [filter, hideMutedMark, toastboxLoaded, user]);

  return null;
}

export default withStyles(style)(ToastMuter);
