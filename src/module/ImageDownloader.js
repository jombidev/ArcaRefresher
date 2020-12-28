import Configure from '../core/Configure';
import ContextMenu from '../core/ContextMenu';
import Parser from '../core/Parser';
import { getBlob, getArrayBuffer } from '../util/DownloadManager';

import stylesheet from '../css/ImageDownloader.css';

export default { load };

const FILENAME = { key: 'imageDownloaderFileName', defaultValue: '%title%' };
const IMAGENAME = { key: 'imageDonwloaderImageName', defaultValue: '%num%' };

function load() {
    try {
        addSetting();

        if(Parser.hasArticle()) {
            addContextMenu();
            apply();
        }
    }
    catch (error) {
        console.error(error);
    }
}

function addSetting() {
    const downloadName = (
        <input type="text" />
    );
    Configure.addSetting({
        category: Configure.categoryKey.UTILITY,
        header: '이미지 일괄 다운로드 압축파일 이름',
        option: downloadName,
        description: (
            <>
                이미지 일괄 다운로드 사용 시 저장할 압축 파일의 이름 포맷입니다.<br />
                %title%: 게시물 제목<br />
                %category%: 게시물 카테고리<br />
                %author%: 게시물 작성자<br />
                %channel%: 채널 이름
            </>
        ),
        callback: {
            save() {
                Configure.set(FILENAME, downloadName.value);
            },
            load() {
                downloadName.value = Configure.get(FILENAME);
            },
        },
    });

    const imageName = (
        <input type="text" />
    );
    Configure.addSetting({
        category: Configure.categoryKey.UTILITY,
        header: '이미지 일괄 다운로드 이미지 이름',
        option: imageName,
        description: (
            <>
                이미지 일괄 다운로드 사용 시 저장할 이미지의 이름 포맷입니다.<br />
                %num%: 넘버링(반드시 사용)<br />
                %title%: 게시물 제목<br />
                %category%: 게시물 카테고리<br />
                %author%: 게시물 작성자<br />
                %channel%: 채널 이름
            </>
        ),
        callback: {
            save() {
                Configure.set(IMAGENAME, imageName.value);
            },
            load() {
                imageName.value = Configure.get(IMAGENAME);
            },
        },
    });
}

function addContextMenu() {
    const copyClipboardItem = ContextMenu.createMenu({
        text: '클립보드에 복사',
        async onClick(event) {
            event.preventDefault();

            const url = ContextMenu.getContextData('url');
            const title = event.target.textContent;

            const buffer = await getArrayBuffer(url,
                e => {
                    const progress = Math.round(e.loaded / e.total * 100);
                    event.target.textContent = `${progress}%`;
                },
                () => {
                    event.target.textContent = title;
                });
            const blob = new Blob([buffer], { type: 'image/png' });
            const item = new ClipboardItem({ [blob.type]: blob });
            navigator.clipboard.write([item]);
            ContextMenu.hide();
        },
    });
    const saveImageItem = ContextMenu.createMenu({
        text: '이미지 저장',
        async onClick(event) {
            event.preventDefault();

            const url = ContextMenu.getContextData('url');
            const title = event.target.textContent;

            const file = await getBlob(url,
                e => {
                    const progress = Math.round(e.loaded / e.total * 100);
                    event.target.textContent = `${progress}%`;
                },
                () => {
                    event.target.textContent = title;
                });
            window.saveAs(file, `image.${file.type.split('/')[1]}`);
            ContextMenu.hide();
        },
    });
    const copyURLItem = ContextMenu.createMenu({
        text: '이미지 주소 복사',
        onClick(event) {
            event.preventDefault();

            const url = ContextMenu.getContextData('url');
            navigator.clipboard.writeText(url);
            ContextMenu.hide();
        },
    });

    const contextElement = (
        <div>
            {copyClipboardItem}
            {saveImageItem}
            {copyURLItem}
        </div>
    );

    ContextMenu.addMenuGroup('clickOnImage', contextElement);
}

function apply() {
    const data = parse();
    if(data.length == 0) return;

    const itemContainer = <div class="image-list" />;
    for(const d of data) {
        const style = { backgroundImage: `url(${d.thumb})` };
        itemContainer.append(
            <div>
                <label class="item" style={style} data-url={d.url}>
                    <input type="checkbox" name="select" />
                </label>
            </div>,
        );
    }

    itemContainer.addEventListener('dblclick', event => {
        const label = event.target.closest('.item');
        if(label) {
            event.preventDefault();
            const value = !label.children[0].checked;

            for(const child of itemContainer.children) {
                child.querySelector('input[type="checkbox"]').checked = value;
            }
        }
    });

    const downloadBtn = <button class="btn btn-arca">일괄 다운로드</button>;
    downloadBtn.addEventListener('click', async event => {
        event.preventDefault();
        downloadBtn.disabled = true;

        const checkedElements = itemContainer.querySelectorAll('input[type="checkbox"]:checked');

        if(checkedElements.length == 0) {
            alert('선택된 파일이 없습니다.');
            downloadBtn.disabled = false;
            return;
        }

        const zip = new JSZip();
        const originalText = downloadBtn.textContent;
        const total = checkedElements.length;
        for(let i = 0; i < checkedElements.length; i++) {
            const url = checkedElements[i].parentNode.dataset.url;
            const ext = url.substring(url.lastIndexOf('.'), url.lastIndexOf('?'));
            const file = await getBlob(url,
                e => {
                    const progress = Math.round(e.loaded / e.total * 100);
                    downloadBtn.textContent = `다운로드 중...${progress}% (${i}/${total})`;
                });

            const filename = replaceData(Configure.get(IMAGENAME)).replace('%num%', `${i}`.padStart(3, '0'));
            zip.file(`${filename}${ext}`, file);
        }
        downloadBtn.textContent = originalText;

        const channelInfo = Parser.getChannelInfo();
        const articleInfo = Parser.getArticleInfo();

        let filename = Configure.get(FILENAME);
        const reservedWord = filename.match(/%\w*%/g);
        if(reservedWord) {
            for(const word of reservedWord) {
                switch(word) {
                case '%title%':
                    filename = filename.replace(word, articleInfo.title);
                    break;
                case '%category%':
                    filename = filename.replace(word, articleInfo.category);
                    break;
                case '%author%':
                    filename = filename.replace(word, articleInfo.author);
                    break;
                case '%channel%':
                    filename = filename.replace(word, channelInfo.name);
                    break;
                default:
                    break;
                }
            }
        }
        const zipblob = await zip.generateAsync({ type: 'blob' });
        window.saveAs(zipblob, `${filename}.zip`);

        downloadBtn.disabled = false;
    });

    const wrapper = (
        <div class="article-image hidden">
            <style>{stylesheet}</style>
            {itemContainer}
            <div>더블클릭을 하면 이미지를 모두 선택할 수 있습니다.</div>
            {downloadBtn}
        </div>
    );

    const enableBtn = <a href="#" class="btn btn-arca"><span class="ion-ios-download-outline" /> 이미지 다운로드 목록 보이기</a>;
    enableBtn.addEventListener('click', event => {
        event.preventDefault();

        if(wrapper.classList.contains('hidden')) {
            wrapper.classList.remove('hidden');
        }
        else {
            wrapper.classList.add('hidden');
        }
    });

    document.querySelector('.article-body')
        .insertAdjacentElement('afterend', enableBtn)
        .insertAdjacentElement('afterend', wrapper);
}

function replaceData(string) {
    const articleInfo = Parser.getArticleInfo();
    const channelInfo = Parser.getChannelInfo();

    const reservedWord = string.match(/%\w*%/g);
    if(reservedWord) {
        for(const word of reservedWord) {
            switch(word) {
            case '%title%':
                string = string.replace(word, articleInfo.title);
                break;
            case '%category%':
                string = string.replace(word, articleInfo.category);
                break;
            case '%author%':
                string = string.replace(word, articleInfo.author);
                break;
            case '%channel%':
                string = string.replace(word, channelInfo.name);
                break;
            default:
                break;
            }
        }
    }

    return string;
}

function parse() {
    const images = document.querySelectorAll('.article-body  img, .article-body video:not([controls])');

    const result = [];

    images.forEach(element => {
        const filepath = element.src.split('?')[0];

        result.push({
            thumb: `${filepath}${element.tagName == 'VIDEO' ? '.gif' : ''}?type=list`,
            url: `${filepath}${element.tagName == 'VIDEO' ? '.gif' : ''}?type=orig`,
            type: 'image',
        });
    });

    return result;
}
