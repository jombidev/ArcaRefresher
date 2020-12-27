import Configure from './core/Configure';
import ContextMenu from './core/ContextMenu';
import Parser from './core/Parser';
import { waitForElement } from './util/ElementDetector';

import AnonymousNick from './module/AnonymousNick';
import AutoRefresher from './module/AutoRefresher';
import ArticleRemover from './module/ArticleRemover';
import MuteContent from './module/MuteContent';
import CategoryColor from './module/CategoryColor';
import ClipboardUpload from './module/ClipboardUpload';
import CommentRefresh from './module/CommentRefresh';
import MuteEmoticon from './module/MuteEmoticon';
import FullAreaReply from './module/FullAreaReply';
import IPScouter from './module/IPScouter';
import ImageDownloader from './module/ImageDownloader';
import ImageSearch from './module/ImageSearch';
import LiveModifier from './module/LiveModifier';
import MyImage from './module/MyImage';
import NewWindow from './module/NewWindow';
import NotificationIconColor from './module/NotificationIconColor';
import RatedownGuard from './module/RatedownGuard';
import ShortCut from './module/ShortCut';
import TemporaryArticle from './module/TemporaryArticle';
import UserMemo from './module/UserMemo';

import FadeStyle from './css/Fade.css';
import { stylesheet as IPScouterStyle } from './css/IPScouter.module.css';

(async function () {
    await waitForElement('head');

    // Load Global CSS
    document.head.append(<style>{FadeStyle}{IPScouterStyle}</style>);

    await waitForElement('.content-wrapper');

    Parser.initialize();

    Configure.initialize();
    CategoryColor.addSetting();
    ImageDownloader.addSetting();
    RatedownGuard.addSetting();
    ShortCut.addSetting();
    MuteContent.addSetting();
    MuteEmoticon.addSetting();
    MyImage.addSetting();
    NewWindow.addSetting();
    NotificationIconColor.addSetting();
    UserMemo.addSetting();
    LiveModifier.addSetting();

    ContextMenu.initialize();
    ImageDownloader.addContextMenu();
    MyImage.addContextMenu();
    ImageSearch.addContextMenu();

    AnonymousNick.load();
    ArticleRemover.load();
    AutoRefresher.load();

    try {
        LiveModifier.apply();
        NotificationIconColor.apply();
    }
    catch(error) {
        console.warn('글로벌 모듈 적용 중 오류 발생');
        console.error(error);
    }

    if(Parser.hasArticle()) {
        try {
            MuteContent.addArticleMenu();

            UserMemo.apply();
            IPScouter.apply('article');

            RatedownGuard.apply();
            ImageDownloader.apply();
        }
        catch (error) {
            console.warn('게시물 처리 중 오류 발생');
            console.error(error);
        }
    }

    if(Parser.hasComment()) {
        MuteEmoticon.mute();
        MuteContent.muteContent('comment');

        CommentRefresh.apply();
        MuteEmoticon.apply();
        FullAreaReply.apply();

        CommentRefresh.addRefreshCallback({
            priority: 100,
            callback() {
                // 모듈 로딩 방식 리팩토링 후 분리
                UserMemo.apply();
                IPScouter.apply('comment');

                MuteEmoticon.apply();
                MuteContent.muteContent('comment');
            },
        });
    }

    if(Parser.hasBoard()) {
        UserMemo.apply();
        IPScouter.apply('board');

        CategoryColor.apply();
        MuteContent.mutePreview();
        MuteContent.muteContent('board');
        NewWindow.apply();

        AutoRefresher.addRefreshCallback({
            priority: 100,
            callback() {
                // 모듈 로딩 방식 리팩토링 후 분리
                UserMemo.apply();
                IPScouter.apply('board');

                CategoryColor.apply();
                MuteContent.mutePreview();
                MuteContent.muteContent('board');
                NewWindow.apply();
            },
        });
    }

    ShortCut.apply(Parser.getCurrentState());

    if(Parser.hasWriteView()) {
        await waitForElement('.fr-box');
        // const FroalaEditor = unsafeWindow.FroalaEditor;
        const editor = unsafeWindow.FroalaEditor('#content');
        ClipboardUpload.apply(editor);
        MyImage.apply(editor);
        TemporaryArticle.apply(editor);
    }
}());
