import React from 'react';
import { DirectionsRun } from '@material-ui/icons';

import { DrawerItem } from 'menu/ConfigMenu';
import { MODULE_ID, MODULE_NAME } from '../ModuleInfo';

export default React.forwardRef((props, ref) =>
  React.cloneElement(
    <DrawerItem ref={ref} configKey={MODULE_ID} icon={<DirectionsRun />}>
      {MODULE_NAME}
    </DrawerItem>,
    props,
  ),
);
