import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  TextField,
  Typography,
  Switch,
  Box,
} from '@material-ui/core';

import Info from '../FeatureInfo';
import {
  $toggleEnable,
  $setFileName,
  $setZipName,
  $setZipImageName,
} from '../slice';
import { FORMAT_STRING, LABEL } from '../format';
import FormatSelector from './FormatSelector';

const View = React.forwardRef((_props, ref) => {
  const dispatch = useDispatch();
  const {
    storage: { enabled, fileName, zipName, zipImageName },
  } = useSelector((state) => state[Info.ID]);

  const handleEnable = useCallback(() => {
    dispatch($toggleEnable());
  }, [dispatch]);

  const handleFileName = useCallback(
    (e) => {
      dispatch($setFileName(e.target.value));
    },
    [dispatch],
  );
  const handleAddFormatFileName = useCallback(
    (value) => {
      dispatch($setFileName(`${fileName}${value}`));
    },
    [dispatch, fileName],
  );

  const handleZipName = useCallback(
    (e) => {
      dispatch($setZipName(e.target.value));
    },
    [dispatch],
  );
  const handleAddFormatZipName = useCallback(
    (value) => {
      dispatch($setZipName(`${zipName}${value}`));
    },
    [dispatch, zipName],
  );

  const handleZipImageName = useCallback(
    (e) => {
      dispatch($setZipImageName(e.target.value));
    },
    [dispatch],
  );
  const handleAddFormatZipImageName = useCallback(
    (value) => {
      dispatch($setZipImageName(`${zipImageName}${value}`));
    },
    [dispatch, zipImageName],
  );

  return (
    <Box ref={ref}>
      <Typography variant="subtitle1">{Info.name}</Typography>
      <Paper>
        <List>
          <ListItem divider button onClick={handleEnable}>
            <ListItemText primary="사용" />
            <ListItemSecondaryAction>
              <Switch checked={enabled} onClick={handleEnable} />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemText primary="우클릭 저장 시 이미지 이름" />
          </ListItem>
          <ListItem divider>
            <TextField fullWidth value={fileName} onChange={handleFileName} />
            <ListItemSecondaryAction>
              <FormatSelector
                formatList={[
                  { value: FORMAT_STRING.CHANNEL, label: LABEL.CHANNEL },
                  { value: FORMAT_STRING.CHANNEL_ID, label: LABEL.CHANNEL_ID },
                  { value: FORMAT_STRING.TITLE, label: LABEL.TITLE },
                  { value: FORMAT_STRING.CATEGORY, label: LABEL.CATEGORY },
                  { value: FORMAT_STRING.AUTHOR, label: LABEL.AUTHOR },
                  { value: FORMAT_STRING.ARTICLE_ID, label: LABEL.ARTICLE_ID },
                  { value: FORMAT_STRING.URL, label: LABEL.URL },
                  {
                    value: FORMAT_STRING.UPLOAD_NAME,
                    label: LABEL.UPLOAD_NAME,
                  },
                ]}
                onSelect={handleAddFormatFileName}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemText primary="일괄 다운로드 시 압축파일 이름" />
          </ListItem>
          <ListItem divider>
            <TextField fullWidth value={zipName} onChange={handleZipName} />
            <ListItemSecondaryAction>
              <FormatSelector
                formatList={[
                  { value: FORMAT_STRING.CHANNEL, label: LABEL.CHANNEL },
                  { value: FORMAT_STRING.CHANNEL_ID, label: LABEL.CHANNEL_ID },
                  { value: FORMAT_STRING.TITLE, label: LABEL.TITLE },
                  { value: FORMAT_STRING.CATEGORY, label: LABEL.CATEGORY },
                  { value: FORMAT_STRING.AUTHOR, label: LABEL.AUTHOR },
                  { value: FORMAT_STRING.ARTICLE_ID, label: LABEL.ARTICLE_ID },
                  { value: FORMAT_STRING.URL, label: LABEL.URL },
                ]}
                onSelect={handleAddFormatZipName}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemText primary="일괄 다운로드 시 압축파일 내 이미지 이름" />
          </ListItem>
          <ListItem>
            <TextField
              fullWidth
              value={zipImageName}
              onChange={handleZipImageName}
            />
            <ListItemSecondaryAction>
              <FormatSelector
                formatList={[
                  { value: FORMAT_STRING.CHANNEL, label: LABEL.CHANNEL },
                  { value: FORMAT_STRING.CHANNEL_ID, label: LABEL.CHANNEL_ID },
                  { value: FORMAT_STRING.TITLE, label: LABEL.TITLE },
                  { value: FORMAT_STRING.CATEGORY, label: LABEL.CATEGORY },
                  { value: FORMAT_STRING.AUTHOR, label: LABEL.AUTHOR },
                  { value: FORMAT_STRING.ARTICLE_ID, label: LABEL.ARTICLE_ID },
                  { value: FORMAT_STRING.URL, label: LABEL.URL },
                  {
                    value: FORMAT_STRING.UPLOAD_NAME,
                    label: LABEL.UPLOAD_NAME,
                  },
                  { value: FORMAT_STRING.NUMBER, label: LABEL.NUMBER },
                ]}
                onSelect={handleAddFormatZipImageName}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
});

View.displayName = `ConfigMenuView(${Info.ID})`;
export default View;