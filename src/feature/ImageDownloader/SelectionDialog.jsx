import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { withStyles } from '@material-ui/styles';
import { Writer } from '@transcend-io/conflux';
import streamSaver from 'streamsaver';

import { ARTICLE_EMOTICON, ARTICLE_GIFS, ARTICLE_IMAGES } from 'core/selector';
import { useContent } from 'util/ContentInfo';

import { request } from 'func/http';
import format from './func/format';
import Info from './FeatureInfo';
import SelectableImageList from './SelectableImageList';
import { setOpen } from './slice';
import { getImageInfo } from './func';

const styles = (theme) => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
  },
  progressContainer: {
    textAlign: 'center',
  },
});

function SelectionDialog({ classes }) {
  const dispatch = useDispatch();
  const contentInfo = useContent();
  const { zipImageName, zipName, zipExtension } = useSelector(
    (state) => state[Info.ID].storage,
  );
  const { open } = useSelector((state) => state[Info.ID]);
  const data = useMemo(() => {
    const isEmotShop = window.location.pathname.indexOf('/e/') !== -1;
    const query = isEmotShop
      ? ARTICLE_EMOTICON
      : `${ARTICLE_IMAGES}, ${ARTICLE_GIFS}`;
    const imageList = [...document.querySelectorAll(query)];
    const dataResult = imageList.reduce((acc, image) => {
      try {
        acc.push(getImageInfo(image));
      } catch (error) {
        console.warn('[ImageDownloader]', error);
      }
      return acc;
    }, []);

    return dataResult;
  }, []);
  const [selection, setSelection] = useState([]);
  const [showProgress, setShowProgress] = useState(false);

  const handleSelection = useCallback((sel) => {
    setSelection(sel);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selection.length !== data.length) {
      setSelection([...new Array(data.length).keys()]);
      return;
    }
    setSelection([]);
  }, [data, selection]);

  const handleDownload = useCallback(async () => {
    dispatch(setOpen(false));
    setSelection([]);
    setShowProgress(true);

    const selectedTable = data.map(() => false);
    selection.forEach((s) => {
      selectedTable[s] = true;
    });
    const selectedImages = selectedTable
      .map((s, i) => (s ? data[i] : undefined))
      .filter((d) => !!d);

    let totalSize = 0;
    const availableImages = await selectedImages.reduce(
      async (promise, info) => {
        try {
          const response = await request(info.orig, {
            method: 'HEAD',
          });
          if (response.status !== 200) throw new Error();
          info.orig = response.finalUrl;

          const size =
            Number(
              response.responseHeaders
                .split('content-length: ')[1]
                .split('\r')[0],
            ) || 0;

          totalSize += size;
          const acc = await promise;
          acc.push(info);
          return acc;
        } catch (error) {
          console.warn(`이미지 파일을 찾지 못함 (${info.orig})`);
          return promise;
        }
      },
      [],
    );

    const iterator = availableImages.values();
    let count = 1;

    const confirm = (event) => {
      event.preventDefault();
      const message =
        '지금 창을 닫으면 다운로드가 중단됩니다. 계속하시겠습니까?';
      event.returnValue = message;
      return message;
    };

    const myReadable = new ReadableStream({
      start() {
        setOpen(false);
        window.addEventListener('beforeunload', confirm);
      },
      async pull(controller) {
        const { done, value } = iterator.next();
        if (done) {
          window.removeEventListener('beforeunload', confirm);
          return controller.close();
        }

        const { orig, ext, uploadName } = value;

        const name = format(zipImageName, {
          values: contentInfo,
          index: count,
          fileName: uploadName,
        });

        const stream = await fetch(orig).then((response) => response.body);
        count += 1;
        return controller.enqueue({
          name: `/${name}.${ext}`,
          stream: () => stream,
        });
      },
      cancel() {
        window.removeEventListener('beforeunload', confirm);
      },
    });

    const zipFileName = format(zipName, { values: contentInfo });

    myReadable.pipeThrough(new Writer()).pipeTo(
      streamSaver.createWriteStream(`${zipFileName}.${zipExtension}`, {
        size: totalSize,
      }),
    );
  }, [
    dispatch,
    data,
    selection,
    zipName,
    contentInfo,
    zipExtension,
    zipImageName,
  ]);

  const handleClose = useCallback(() => {
    dispatch(setOpen(false));
  }, [dispatch]);

  const handleSubmit = useCallback(
    (e) => {
      if (e.key && e.key !== 'Enter') return;
      if (selection.length === 0) return;

      handleDownload();
    },
    [handleDownload, selection],
  );

  const imgList = data.map(({ thumb }) => thumb);

  if (showProgress) {
    return (
      <Dialog
        maxWidth="lg"
        open={open}
        TransitionProps={{ onExited: () => setShowProgress(false) }}
      >
        <DialogContent classes={{ root: classes.progressContainer }}>
          <CircularProgress color="primary" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={handleClose}
      onKeyUp={handleSubmit}
    >
      <DialogTitle>
        <Typography>이미지 다운로더</Typography>
        <IconButton className={classes.closeButton} onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <SelectableImageList
          imgList={imgList}
          selection={selection}
          onChange={handleSelection}
        />
      </DialogContent>
      <DialogActions>
        <Typography>{`${selection.length}/${imgList.length}`}</Typography>
        <Button variant="outlined" onClick={handleSelectAll}>
          {selection.length !== data.length ? '전체 선택' : '선택 해제'}
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={selection.length === 0}
          onClick={handleDownload}
        >
          다운로드
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default withStyles(styles)(SelectionDialog);
